import LiquipediaAPI from '@shared/helpers/liquipediaApi';
import withDb from '@shared/helpers/withDb';

const playerKeys = ['p1', 'p2', 'p3', 'p4', 'p5'] as const;

function getBeatPercent(position: string, participants: number) : number {
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

const DB_READONLY = false;
const DB_NEW_CONNECTION = true;

export const handler = withDb(DB_READONLY, DB_NEW_CONNECTION, async (dbConn) => {
    let timesToFetch = 5;

    while (--timesToFetch > 0) {
        const tournamentsToProcess = await dbConn('tournaments')
            .select('page_id', 'no_participants')
            .where('has_been_checked', false)
            .limit(3);

        console.log(`Found ${tournamentsToProcess.length} tournaments to process`);

        if (tournamentsToProcess.length === 0) {
            break;
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
                await dbConn('tournaments')
                    .where('page_id', pageId)
                    .update('has_been_checked', true);

                delete results[+pageId];

                continue;
            }

            resultsByPageId[+pageId] = validResults;
        }

        if (Object.keys(resultsByPageId).length === 0) {
            continue;
        }

        const allTRsToProcess = Object.values(resultsByPageId).flat();

        let allTeamPaths = allTRsToProcess.map(tr => tr.opponentname.replace(/\s/g, '_'));
        allTeamPaths = Array.from(new Set(allTeamPaths));

        const knownTeams = await dbConn('teams')
            .select('path_name', 'page_id')
            .whereIn('path_name', allTeamPaths);

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

            await dbConn('teams')
                .insert([
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
                ])
                .onConflict([ 'path_name' ])
                .merge([ 'path_name', 'name' ]);
        }

        let allPlayerPaths = allTRsToProcess.flatMap(
            tr => playerKeys.map(k => tr.opponentplayers[k]).filter(Boolean),
        );
        allPlayerPaths = Array.from(new Set(allPlayerPaths));

        const knownPlayers = await dbConn('players')
            .select('page_id', 'path_name')
            .whereIn('path_name', allPlayerPaths);

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
                await dbConn('players')
                    .insert(missingPlayersData.map(p => ({
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
                        roles: JSON.stringify([]),
                    })))
                    .onConflict('path_name')
                    .merge([
                        'path_name',
                        'name',
                        'alt_names',
                        'birth_date',
                        'birth_date',
                        'nationalities',
                        'signature_champions',
                    ]);
            }
        }

        // update roles
        for (const tournamentResult of allTRsToProcess) {
            for (const [playerKey, playerPath] of Object.entries(tournamentResult.opponentplayers)) {
                let roleFromTournament: string|null = null;
                switch (playerKey) {
                    case 'p1':
                        roleFromTournament = 'top';
                        break;
                    case 'p2':
                        roleFromTournament = 'jungle';
                        break;
                    case 'p3':
                        roleFromTournament = 'mid';
                        break;
                    case 'p4':
                        roleFromTournament = 'bot';
                        break;
                    case 'p5':
                        roleFromTournament = 'support';
                        break;
                    default:
                        break;
                }

                if (roleFromTournament === null) continue;

                const player = await dbConn('players').where('path_name', playerPath).first('roles');
                if (!player) continue;

                const currentRoles: string[] = JSON.parse(player.roles || '[]');
                const newRoles = Array.from(new Set([...currentRoles, roleFromTournament]));

                await dbConn('players')
                    .where('path_name', playerPath)
                    .update({ roles: JSON.stringify(newRoles) });
            }
        }

        await dbConn('tournament_results')
            .insert(allTRsToProcess.flatMap(
                tr => playerKeys
                    .filter(k => !playersNotInLiquipedia.includes(tr.opponentplayers[k]))
                    .map(k => ({
                        tournament_path: tr.pagename,
                        player_path: tr.opponentplayers[k],
                        team_path: tr.opponentname.replace(/\s/g, '_'),
                        position: tr.placement,
                        beat_percent: getBeatPercent(tr.placement, pageIdToParticipants[tr.pageid]),
                        liquipedia_weight: tr.weight,
                    })),
            ))
            .onConflict(['tournament_path', 'player_path', 'team_path'])
            .merge([
                'position',
                'beat_percent',
                'liquipedia_weight',
            ]);

        await dbConn('tournaments')
            .whereIn('page_id', Object.keys(pageIdToParticipants))
            .update('has_been_checked', true);

        await new Promise(res => setTimeout(res, 4_000));
    }
});
