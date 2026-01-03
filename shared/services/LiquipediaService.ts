import Knex from 'knex';
import LiquipediaAPI from '@shared/infrastructure/liquipediaApi';
import {
    Players as PlayersRepository,
    Teams as TeamsRespository,
    TournamentResults as TournamentResultsRepository,
    Tournaments as TournamentsRepository,
} from '@shared/repository/sqlite';
import { getSeriesFromTournamentPath } from '@shared/domain/tournamentSeries';

export default class LiquipediaService {
    static readonly BLACKLIST_TOURNAMENTS = [
        'promotion',
        'qualifier',
        'rift rivals',
        'all-star',
        'circuit points',
        'aram',
        'play-in',
        'spring expansion',
        'worlds qualifying series',
        'season kickoff',
        'season opening',
    ];

    static readonly ROLE_ALIASES: Record<string, string> = {
        'toplaner': 'top',
        'jungler': 'jungle',
        'jg': 'jungle',
        'jgl': 'jungle',
        'midlaner': 'mid',
        'botlaner': 'bot',
        'adc': 'bot',
        'ad': 'bot',
        'ad carry': 'bot',
        'supporter': 'support',
        'sup': 'support',
        'supp': 'support',
    };

    private _dbConn: Knex.Knex;

    constructor(dbConn: Knex.Knex) {
        this._dbConn = dbConn;
    }

    private _getBeatPercent(position: string, participants: number) : number | null {
        if (position === '') {
            return null;
        }

        const intPosition = +(position.split('-').pop() || '');

        if (!intPosition || Number.isNaN(intPosition)) {
            return 0;
        }

        if (participants <= 0) {
            return 0;
        }

        const numOtherTeams = participants - 1;
        const numTeamsBeat = participants - intPosition;

        if (numTeamsBeat === 0) {
            return 0;
        }

        return Math.ceil((numTeamsBeat / numOtherTeams) * 100);
    }

    private async _findNewTournaments() {
        const STierResults = await LiquipediaAPI.query(
            'tournament',
            [
                'pageid',
                'pagename',
                'name',
                'shortname',
                'tickername',
                'startdate',
                'enddate',
                'participantsnumber',
                'liquipediatier',
                'locations',
            ],
            {
                liquipediatier: '1',
                startdate: `<${(new Date()).toISOString().split('T').shift()}`,
            },
        );

        const yearNow = (new Date()).getUTCFullYear();
        const minDateEnd = `${yearNow - 2}-01-01`;
        const worseTierResults = await LiquipediaAPI.query(
            'tournament',
            [
                'pageid',
                'pagename',
                'name',
                'shortname',
                'tickername',
                'startdate',
                'enddate',
                'participantsnumber',
                'liquipediatier',
                'locations',
            ],
            {
                liquipediatier: ['2', '3'],
                enddate: `>${minDateEnd}`,
                startdate: `<${(new Date()).toISOString().split('T').shift()}`,
            }
        );

        const filteredResults = [...STierResults, ...worseTierResults].filter(
            r => !LiquipediaService.BLACKLIST_TOURNAMENTS.some(
                term => r.name.toLowerCase().includes(term),
            ),
        );

        console.log(`Upserting ${filteredResults.length} tournaments`);

        const tournamentsRepo = new TournamentsRepository(this._dbConn);
        await tournamentsRepo.upsertMultiple(filteredResults.map(r => {
            let region = getSeriesFromTournamentPath(r.pagename)?.Region || r.locations.region || r.locations.region1;
            if (region === 'Europe') {
                region = 'EU';
            }

            return {
                page_id: r.pageid,
                path_name: r.pagename,
                name: r.name,
                alt_names: JSON.stringify(
                    Array.from(new Set([ r.shortname, r.tickername ].filter(Boolean)))
                ),
                series: getSeriesFromTournamentPath(r.pagename)?.Name || 'Non STier',
                region:  region,
                start_date: r.startdate,
                end_date: r.enddate,
                no_participants: (r.participantsnumber < 0) ? 0 : r.participantsnumber,
                has_been_checked: false,
                tier: +r.liquipediatier,
            };
        }));
    }

    private async _scrapeTournaments() {
        const tournamentsRepo = new TournamentsRepository(this._dbConn);
        const tournamentResultsRepo = new TournamentResultsRepository(this._dbConn);
        const playersRepo = new PlayersRepository(this._dbConn);
        const teamsRepo = new TeamsRespository(this._dbConn);

        const tournamentsToProcess = await tournamentsRepo.getMultipleNotChecked(3);

        console.log(`Found ${tournamentsToProcess.length} tournaments to process`);

        if (tournamentsToProcess.length === 0) {
            return;
        }

        const pageIdToParticipants = tournamentsToProcess.reduce(
            (prev, curr) => ({...prev, [curr.page_id]: curr.no_participants}),
            {} as Record<number, number>,
        );

        console.log(pageIdToParticipants);

        const tournamentResults = await LiquipediaAPI.query(
            'placement',
            [
                'pageid',
                'pagename',
                'weight',
                'opponentplayers',
                'opponentname',
                'placement',
                'lastvsdata',
            ],
            {
                pageid: Object.keys(pageIdToParticipants),
                mode: 'team',
            },
        );

        const resultsByPageId = tournamentResults.reduce(
            (prev, curr) => ({
                ...prev,
                [curr.pageid]: [...(prev[curr.pageid] || []), curr]
            }),
            {} as Record<number, typeof tournamentResults>,
        );

        for (const [pageId, results] of Object.entries(resultsByPageId)) {
            const validResults = results.filter(tr => Object.keys(tr.opponentplayers).length > 0);

            if (validResults.length === 0) {
                await tournamentsRepo.setHasBeenCheckedForPageIds([ Number(pageId) ]);
                delete results[+pageId];

                continue;
            }

            resultsByPageId[+pageId] = validResults;
        }

        if (Object.keys(resultsByPageId).length === 0) {
            return;
        }

        // All results data for teams that have actually played a game so far
        const allTRsToProcess = Object.values(resultsByPageId)
            .flat()
            .filter(tr => tr.lastvsdata !== null);

        let allTeamPaths = allTRsToProcess.map(tr => tr.opponentname.replace(/\s/g, '_'));
        allTeamPaths = Array.from(new Set(allTeamPaths));

        const knownTeams = await teamsRepo.getMultipleByPaths(allTeamPaths);

        const missingTeamPaths = allTeamPaths.filter(
            tPath => !knownTeams.some(dbTeam => dbTeam.path_name === tPath),
        );
        if (missingTeamPaths.length > 0) {
            const missingTeamData = await LiquipediaAPI.query(
                'team',
                [
                    'pageid',
                    'pagename',
                    'name',
                ],
                { 'pagename': missingTeamPaths },
            );

            const teamsNotOnLiquipedia = missingTeamPaths.filter(
                teamPath => !missingTeamData.some(teamData => teamData.pagename === teamPath),
            );

            await teamsRepo.upsertMultiple([
                ...missingTeamData.map(t => ({
                    page_id: t.pageid,
                    path_name: t.pagename,
                    name: t.name,
                })),
                ...teamsNotOnLiquipedia.map(tPath => ({
                    page_id: null,
                    path_name: tPath,
                    name: tPath.replace(/_/g, ' '),
                }))
            ]);
        }

        let allPlayerPaths = allTRsToProcess.flatMap(
            tr => LiquipediaAPI.PLAYER_KEYS.map(k => tr.opponentplayers[k]).filter(Boolean),
        );
        allPlayerPaths = Array.from(new Set(allPlayerPaths));

        const knownPlayers = await playersRepo.getMultipleByPaths(allPlayerPaths);

        const missingPlayerPaths = allPlayerPaths.filter(
            pPath => !knownPlayers.some(dbPlayer => dbPlayer.path_name === pPath),
        );
        const playersNotInLiquipedia: string[] = [];

        if (missingPlayerPaths.length > 0) {
            const missingPlayersData = await LiquipediaAPI.query(
                'player',
                [
                    'pageid',
                    'pagename',
                    'id',
                    'alternateid',
                    'nationality',
                    'nationality2',
                    'nationality3',
                    'birthdate',
                    'extradata',
                ],
                { pagename: missingPlayerPaths },
            );

            playersNotInLiquipedia.push(
                ...missingPlayerPaths.filter(
                    pPath => !missingPlayersData.some(playerData => playerData.pagename === pPath),
                ),
            );

            if (missingPlayersData.length > 0) {
                await playersRepo.upsertMultiple(missingPlayersData.map(p => ({
                    page_id: p.pageid,
                    path_name: p.pagename,
                    name: p.id,
                    alt_names: JSON.stringify(
                        (p.alternateid||'')
                            .split(',')
                            .map(id => id.trim())
                            .filter(Boolean),
                    ),
                    birth_date: p.birthdate,
                    nationalities: JSON.stringify([
                        p.nationality,
                        p.nationality2,
                        p.nationality3,
                    ].filter(Boolean)),
                    signature_champions: JSON.stringify([
                        p.extradata.signatureChampion1,
                        p.extradata.signatureChampion2,
                        p.extradata.signatureChampion3,
                        p.extradata.signatureChampion4,
                    ].filter(Boolean)),
                    roles: JSON.stringify(
                        Object.values(p.extradata.roles || {})
                            .map(role => role.toLowerCase())
                            .map(role => LiquipediaService.ROLE_ALIASES[role] || role)
                            .filter(role => Object.values(LiquipediaService.ROLE_ALIASES).includes(role)),
                    ),
                })));
            }
        }

        await tournamentResultsRepo.upsertMultiple(
            allTRsToProcess.flatMap(
                tr => LiquipediaAPI.PLAYER_KEYS
                    .filter(k => !playersNotInLiquipedia.includes(tr.opponentplayers[k]))
                    .filter(k => (k in tr.opponentplayers))
                    .map(k => ({
                        tournament_path: tr.pagename,
                        player_path: tr.opponentplayers[k],
                        team_path: tr.opponentname.replace(/\s/g, '_'),
                        position: tr.placement || null,
                        beat_percent: this._getBeatPercent(
                            tr.placement,
                            pageIdToParticipants[tr.pageid],
                        ),
                        liquipedia_weight: tr.weight || null,
                    })),
            ),
        );

        const finishedPageIds: number[] = [];
        for (const [pageId, results] of Object.entries(resultsByPageId)) {
            const tournyHasFinished = !results.some(tr => tr.placement === '');
            if (tournyHasFinished) {
                finishedPageIds.push(+pageId);
            }
        }

        await tournamentsRepo.setHasBeenCheckedForPageIds(finishedPageIds);
    }

    async gatherTournamentData() {
        await this._findNewTournaments();
        await this._scrapeTournaments();
    }
}
