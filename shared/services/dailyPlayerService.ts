import Knex from 'knex';
import DailyPlayer from '@shared/repository/dynamoDb/dailyPlayer';
import { type Tier1Region, getSeriesFromTournamentPath } from '@shared/domain/tournamentSeries';
import {
    TournamentResults as TournamentResultsRepository,
    Tournaments as TournamentsRepository,
    Players as PlayersRepository,
    Teams as TeamsRepository,
} from '@shared/repository/sqlite';
import { type ValidRegions } from './guessService';
import { type PlayerRow } from '@shared/repository/sqlite/players';

export default class DailyPlayerService {
    private _dbConn?: Knex.Knex;

    constructor(dbConn?: Knex.Knex) {
        this._dbConn = dbConn;
    }

    async getCurrentDateKeyAndHints() {
        const dailyPlayerRepo = new DailyPlayer();
        const todaysPlayers = (await dailyPlayerRepo.getMostRecentPlayers(1))[0];
        return {
            gameKey: todaysPlayers.date,
            hints: {
                'ALL': todaysPlayers.playerPathAll.hints,
                'ALL_HARD': todaysPlayers.playerPathHard.hints,
                'EU': todaysPlayers.playerPathEU.hints,
                'NA': todaysPlayers.playerPathNA.hints,
                'KR': todaysPlayers.playerPathKR.hints,
                'CH': todaysPlayers.playerPathCH.hints,
            }
        };
    }

    async getPreviousPlayers() : Promise<{gameKey: string, results: Record<ValidRegions, string>}> {
        const dailyPlayerRepo = new DailyPlayer();
        const previousPlayers = (await dailyPlayerRepo.getMostRecentPlayers(2))[1];

        return {
            gameKey: previousPlayers.date,
            results: {
                'ALL': previousPlayers.playerPathAll.path,
                'ALL_HARD': previousPlayers.playerPathHard.path,
                'EU': previousPlayers.playerPathEU.path,
                'NA': previousPlayers.playerPathNA.path,
                'KR': previousPlayers.playerPathKR.path,
                'CH': previousPlayers.playerPathCH.path,
            },
        };
    }

    private async _getRandomPlayerForRegion(excludePlayerPaths: string[], minTournamentDate?: string, region?: Tier1Region) {
        if (!this._dbConn) {
            throw new Error('DB has not been supplied');
        }

        const tournamentsRepo = new TournamentsRepository(this._dbConn);
        const recentTournaments = (await tournamentsRepo.getMultipleSTierEndedAfterDate(minTournamentDate))
            .filter(tournament => {
                if (!region) {
                    return tournament.region !== 'International';
                }

                return tournament.region === region;
            });

        const tournamentResultsRepo = new TournamentResultsRepository(this._dbConn);
        const playersInRecentTournaments = await tournamentResultsRepo.getMultipleByTournaments(
            recentTournaments.map(t => t.path_name),
        );

        const uniquePlayerOptions = Array.from(new Set(
            playersInRecentTournaments.map(tr => tr.player_path),
        ));

        const playerRepo = new PlayersRepository(this._dbConn);
        let validPlayerRows = await playerRepo.getMultipleByPaths(uniquePlayerOptions);
        validPlayerRows = validPlayerRows.filter(player => JSON.parse(player.roles).length > 0);

        let randomResult: PlayerRow;

        do {
            randomResult = validPlayerRows.sort(() => Math.random() > 0.5 ? -1 : 1).pop()!;
        } while (excludePlayerPaths.includes(randomResult.path_name))

        return randomResult.path_name;
    }

    private async _getHintsForPlayer(playerPath: string) {
        if (!this._dbConn) {
            throw new Error('DB has not been supplied');
        }

        const tournamentResultsRepo = new TournamentResultsRepository(this._dbConn);
        const tournamentsRepo = new TournamentsRepository(this._dbConn);
        const teamsRepo = new TeamsRepository(this._dbConn);
        const playerRepo = new PlayersRepository(this._dbConn);

        const allResults = (await tournamentResultsRepo.getMultipleByPlayerOrderedByTournamentStart(playerPath))
            .filter(r => (getSeriesFromTournamentPath(r.tournament_path)?.Importance || 0) > 0);

        if (allResults.length > 1) {
            allResults.shift(); // Get rid of most recent result
        }

        allResults.sort(() => Math.random() > 0.5 ? -1 : 1);

        const resultForTeamHint = allResults.length > 1 ? allResults.pop()! : allResults[0];
        const resultForTournamentHint = allResults.length > 1 ? allResults.pop()! : allResults[0];
        // Try to get a player they played with from a different team to that of the team hint
        const resultsForOtherTeams = allResults.filter(r => r.team_path !== resultForTeamHint.team_path);
        const resultForPlayerHint = resultsForOtherTeams.length > 0
            ? resultsForOtherTeams[0]
            : allResults[0];

        console.dir({ resultForTournamentHint, resultForTeamHint, resultForPlayerHint }, { depth: null });

        const tounamentPlayedIn = (await tournamentsRepo.getByPath(resultForTournamentHint.tournament_path))!.name;
        const teamPlayedFor = (await teamsRepo.getByPath(resultForTeamHint.team_path))!.name;
        const playerPathsPlayedWith = await tournamentResultsRepo.getPlayersByTournmantAndTeam(
            resultForPlayerHint.tournament_path,
            resultForPlayerHint.team_path,
        );
        const playerPathPlayedWith = playerPathsPlayedWith
            .map(p => p.player_path)
            .filter(p => p !== playerPath)
            .sort(() => Math.random() > 0.5 ? -1 : 1)[0];
        const playerPlayedWith = (await playerRepo.getByPath(playerPathPlayedWith))!.name;

        return {
            tournamentHint: tounamentPlayedIn,
            teamHint: teamPlayedFor,
            playerHint: playerPlayedWith,
        };
    }

    private async _insertPlayersForDay(date: string) {
        if (!this._dbConn) {
            throw new Error('DB has not been supplied');
        }

        const dailyPlayerTable = new DailyPlayer();
        const lastWeekOfPlayers = await dailyPlayerTable.getMostRecentPlayers(7);

        const yearNow = (new Date()).getUTCFullYear();
        const minDateEnded = `${yearNow - 2}-01-01`;

        const playerForAll = await this._getRandomPlayerForRegion(
            lastWeekOfPlayers.map(row => row.playerPathAll.path),
            minDateEnded,
        );
        const hintForAll = await this._getHintsForPlayer(playerForAll);

        const playerForHard = await this._getRandomPlayerForRegion(
            lastWeekOfPlayers.map(row => row.playerPathHard.path),
        );
        const hintForHard = await this._getHintsForPlayer(playerForHard);

        const playerForEU = await this._getRandomPlayerForRegion(
            lastWeekOfPlayers.map(row => row.playerPathEU.path),
            minDateEnded,
            'EU',
        );
        const hintForEU = await this._getHintsForPlayer(playerForEU);

        const playerForNA = await this._getRandomPlayerForRegion(
            lastWeekOfPlayers.map(row => row.playerPathNA.path),
            minDateEnded,
            'NA',
        );
        const hintForNA = await this._getHintsForPlayer(playerForNA);

        const playerForCH = await this._getRandomPlayerForRegion(
            lastWeekOfPlayers.map(row => row.playerPathCH.path),
            minDateEnded,
            'China',
        );
        const hintForCH = await this._getHintsForPlayer(playerForCH);

        const playerForKR = await this._getRandomPlayerForRegion(
            lastWeekOfPlayers.map(row => row.playerPathKR.path),
            minDateEnded,
            'Korea',
        );
        const hintForKR = await this._getHintsForPlayer(playerForKR);

        console.log({
            playerForAll,
            hintForAll,
            playerForHard,
            hintForHard,
            playerForEU,
            hintForEU,
            playerForNA,
            hintForNA,
            playerForCH,
            hintForCH,
            playerForKR,
            hintForKR,
        });

        await dailyPlayerTable.insert({
            date: date,
            playerPathAll: {
                path: playerForAll,
                hints: {
                    tournament: hintForAll.tournamentHint,
                    team: hintForAll.teamHint,
                    player: hintForAll.playerHint,
                },
            },
            playerPathHard: {
                path: playerForHard,
                hints: {
                    tournament: hintForHard.tournamentHint,
                    team: hintForHard.teamHint,
                    player: hintForHard.playerHint
                },
            },
            playerPathEU: {
                path: playerForEU,
                hints: {
                    tournament: hintForEU.tournamentHint,
                    team: hintForEU.teamHint,
                    player: hintForEU.playerHint,
                },
            },
            playerPathNA: {
                path: playerForNA,
                hints: {
                    tournament: hintForNA.tournamentHint,
                    team: hintForNA.teamHint,
                    player: hintForNA.playerHint,
                },
            },
            playerPathCH: {
                path: playerForCH,
                hints: {
                    tournament: hintForCH.tournamentHint,
                    team: hintForCH.teamHint,
                    player: hintForCH.playerHint,
                },
            },
            playerPathKR: {
                path: playerForKR,
                hints: {
                    tournament: hintForKR.tournamentHint,
                    team: hintForKR.teamHint,
                    player: hintForKR.playerHint,
                },
            },
        });
    }

    async insertPlayersOfTheDay() {
        const dailyPlayerTable = new DailyPlayer();

        const todaysDate = (new Date()).toISOString().split('T')[0];
        const existingToday = await dailyPlayerTable.getByDate(todaysDate);
        if (!existingToday) {
            await this._insertPlayersForDay(todaysDate);
        }

        const yesterdaysDate = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const existingYesterday = await dailyPlayerTable.getByDate(yesterdaysDate);
        if (!existingYesterday) {
            await this._insertPlayersForDay(yesterdaysDate);
        }
    }
}
