import Knex from 'knex';
import DailyPlayer from '@shared/repository/dynamoDb/dailyPlayer';
import { getSeriesFromTournamentPath } from '@shared/domain/tournamentSeries';
import {
    TournamentResults as TournamentResultsRepository,
    Tournaments as TournamentsRepository,
} from '@shared/repository/sqlite';

export default class DailyPlayerService {
    private _dbConn: Knex.Knex;

    constructor(dbConn: Knex.Knex) {
        this._dbConn = dbConn;
    }

    async insertPlayerOfTheDay() {
        const dailyPlayerTable = new DailyPlayer();
        const lastWeekOfPlayers = await dailyPlayerTable.getMostRecentPlayers(7);
        const excludePlayerPaths = lastWeekOfPlayers.map(row => row.playerPath);

        const yearNow = (new Date()).getUTCFullYear();
        const minDateEnded = `${yearNow - 2}-01-01`;

        const tournamentsRepo = new TournamentsRepository(this._dbConn);
        const recentTournaments = (await tournamentsRepo.getMultipleEndedAfterDate(minDateEnded))
            .filter(tournament => getSeriesFromTournamentPath(tournament.path_name)?.Region !== 'International');

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

        console.log({ randomResult });

        await dailyPlayerTable.insert({
            date: (new Date()).toISOString().split('T')[0],
            playerPath: randomResult,
        });
    }
}
