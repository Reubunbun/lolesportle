import Knex from 'knex';
import DailyPlayer from '@shared/repository/dynamoDb/dailyPlayer';
import { type Tier1Region } from '@shared/domain/tournamentSeries';
import {
    TournamentResults as TournamentResultsRepository,
    Tournaments as TournamentsRepository,
    Players as PlayersRepository,
} from '@shared/repository/sqlite';
import { type ValidRegions } from './guessService';
import { type PlayerRow } from '@shared/repository/sqlite/players';

export default class DailyPlayerService {
    private _dbConn?: Knex.Knex;

    constructor(dbConn?: Knex.Knex) {
        this._dbConn = dbConn;
    }

    async getCurrentDateKey() {
        const dailyPlayerRepo = new DailyPlayer();
        const todaysPlayers = (await dailyPlayerRepo.getMostRecentPlayers(1))[0];
        return todaysPlayers.date;
    }

    async getPreviousPlayers() : Promise<{gameKey: string, results: Record<ValidRegions, string>}> {
        const dailyPlayerRepo = new DailyPlayer();
        const previousPlayers = (await dailyPlayerRepo.getMostRecentPlayers(2))[1];

        return {
            gameKey: previousPlayers.date,
            results: {
                'ALL': previousPlayers.playerPathAll,
                'ALL_HARD': previousPlayers.playerPathHard,
                'EU': previousPlayers.playerPathEU,
                'NA': previousPlayers.playerPathNA,
                'KR': previousPlayers.playerPathKR,
                'CH': previousPlayers.playerPathCH,
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

    async insertPlayersOfTheDay() {
        if (!this._dbConn) {
            throw new Error('DB has not been supplied');
        }

        const dailyPlayerTable = new DailyPlayer();
        const lastWeekOfPlayers = await dailyPlayerTable.getMostRecentPlayers(7);

        const yearNow = (new Date()).getUTCFullYear();
        const minDateEnded = `${yearNow - 2}-01-01`;

        const playerFoAll = await this._getRandomPlayerForRegion(lastWeekOfPlayers.map(row => row.playerPathAll), minDateEnded);
        const playerForHard = await this._getRandomPlayerForRegion(lastWeekOfPlayers.map(row => row.playerPathHard));
        const playerFoEU = await this._getRandomPlayerForRegion(lastWeekOfPlayers.map(row => row.playerPathEU), minDateEnded, 'EU');
        const playerFoNA = await this._getRandomPlayerForRegion(lastWeekOfPlayers.map(row => row.playerPathNA), minDateEnded, 'NA');
        const playerFoCH = await this._getRandomPlayerForRegion(lastWeekOfPlayers.map(row => row.playerPathCH), minDateEnded, 'China');
        const playerFoKR = await this._getRandomPlayerForRegion(lastWeekOfPlayers.map(row => row.playerPathKR), minDateEnded, 'Korea');

        console.log({
            playerFoAll,
            playerForHard,
            playerFoEU,
            playerFoNA,
            playerFoCH,
            playerFoKR,
        });

        await dailyPlayerTable.insert({
            date: (new Date()).toISOString().split('T')[0],
            playerPathAll: playerFoAll,
            playerPathHard: playerForHard,
            playerPathEU: playerFoEU,
            playerPathNA: playerFoNA,
            playerPathCH: playerFoCH,
            playerPathKR: playerFoKR,
        });
    }
}
