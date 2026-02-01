import DailyPlayerService from '@shared/services/dailyPlayerService';
import {
    Players as PlayersRepository,
    Teams as TeamsRepository,
    Tournaments as TournamentsRepository,
    TournamentResults as TournamentResultsRepository,
} from '@shared/repository/sqlite';
import DailyPlayer from '@shared/repository/dynamoDb/dailyPlayer';
import withDb from '@shared/infrastructure/withDb';
import PlayerSelectService from '@shared/services/playerSelectService';

const DB_READONLY = true;
const DB_NEW_CONNECTION = true;

export const handler = withDb(DB_READONLY, DB_NEW_CONNECTION, async (dbConn) => {
    const dailyPlayerService = new DailyPlayerService({
        dailyPlayerRepo: new DailyPlayer(),
        playerSelectService: new PlayerSelectService({
            tournamentResultsRepo: new TournamentResultsRepository(dbConn),
            tournamentsRepo: new TournamentsRepository(dbConn),
            playersRepo: new PlayersRepository(dbConn),
            teamsRepo: new TeamsRepository(dbConn),
        }),
    });
    await dailyPlayerService.insertPlayersOfTheDay();
});
