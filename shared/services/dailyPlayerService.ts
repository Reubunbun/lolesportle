import Knex from 'knex';
import DailyPlayer from '@shared/repository/dynamoDb/dailyPlayer';
import { getSeriesFromTournamentPath, type Region } from '@shared/domain/tournamentSeries';
import {
    TournamentResults as TournamentResultsRepository,
    Tournaments as TournamentsRepository,
} from '@shared/repository/sqlite';

export default class DailyPlayerService {
    private _dbConn?: Knex.Knex;

    constructor(dbConn?: Knex.Knex) {
        this._dbConn = dbConn;
    }

    async getCurrentDateKey() {
        const dailyPlayerRepo = new DailyPlayer();
        const todaysPlayer = (await dailyPlayerRepo.getMostRecentPlayers(1))[0];
        return todaysPlayer.date;
    }

    private async _getRandomPlayerForRegion(excludePlayerPaths: string[], region?: Region) {
        if (!this._dbConn) {
            throw new Error('DB has not been supplied');
        }

        const yearNow = (new Date()).getUTCFullYear();
        const minDateEnded = `${yearNow - 2}-01-01`;

        const tournamentsRepo = new TournamentsRepository(this._dbConn);
        const recentTournaments = (await tournamentsRepo.getMultipleEndedAfterDate(minDateEnded))
            .filter(tournament => {
                if (!region) {
                    return getSeriesFromTournamentPath(tournament.path_name)?.Region !== 'International'
                }

                return getSeriesFromTournamentPath(tournament.path_name)?.Region === region;
            });

        const tournamentResultsRepo = new TournamentResultsRepository(this._dbConn);
        const playersInRecentTournaments = await tournamentResultsRepo.getMultipleByTournaments(
            recentTournaments.map(t => t.path_name),
        );

        const uniquePlayerOptions = Array.from(new Set(
            playersInRecentTournaments.map(tr => tr.player_path),
        ));

        let randomResult: string;

        do {
            randomResult = uniquePlayerOptions.sort(() => Math.random() > 0.5 ? -1 : 1).pop()!;
        } while (excludePlayerPaths.includes(randomResult))

        return randomResult;
    }

    async insertPlayerOfTheDay() {
        if (!this._dbConn) {
            throw new Error('DB has not been supplied');
        }

        const dailyPlayerTable = new DailyPlayer();
        const lastWeekOfPlayers = await dailyPlayerTable.getMostRecentPlayers(7);

        const playerFoAll = await this._getRandomPlayerForRegion(lastWeekOfPlayers.map(row => row.playerPathAll));
        const playerFoEU = await this._getRandomPlayerForRegion(lastWeekOfPlayers.map(row => row.playerPathEU), 'EU');
        const playerFoNA = await this._getRandomPlayerForRegion(lastWeekOfPlayers.map(row => row.playerPathNA), 'NA');
        const playerFoCH = await this._getRandomPlayerForRegion(lastWeekOfPlayers.map(row => row.playerPathCH), 'China');
        const playerFoKR = await this._getRandomPlayerForRegion(lastWeekOfPlayers.map(row => row.playerPathKR), 'Korea');

        await dailyPlayerTable.insert({
            date: (new Date()).toISOString().split('T')[0],
            playerPathAll: playerFoAll,
            playerPathEU: playerFoEU,
            playerPathNA: playerFoNA,
            playerPathCH: playerFoCH,
            playerPathKR: playerFoKR,
        });
    }
}
