import withDb from '@shared/infrastructure/withDb';
import { createHttpResponse } from '@shared/helpers/httpResponse';
import {
    TournamentResults as TournamentResultsRepository,
    Tournaments as TournamentsRepository,
    Players as PlayersRepository,
    Teams as TeamsRepository,
} from '@shared/repository/sqlite';
import DailyPlayer from '@shared/repository/dynamoDb/dailyPlayer';
import DailyPlayerService from '@shared/services/dailyPlayerService';
import PlayerSelectService from '@shared/services/playerSelectService';

const DB_READONLY = true;
const DB_NEW_CONNECTION = false;

export const handler = withDb(DB_READONLY, DB_NEW_CONNECTION, async (dbConn) => {
    const service = new DailyPlayerService({
        dailyPlayerRepo: new DailyPlayer(),
        playerSelectService: new PlayerSelectService({
            tournamentResultsRepo: new TournamentResultsRepository(dbConn),
            tournamentsRepo: new TournamentsRepository(dbConn),
            playersRepo: new PlayersRepository(dbConn),
            teamsRepo: new TeamsRepository(dbConn),
        })
    });
    const { gameKey, hints } = await service.getCurrentDateKeyAndHints();
    const yesterdaysPlayers = await service.getPreviousPlayers();

    return createHttpResponse(200, {
        gameKey,
        hints,
        previousPlayers: yesterdaysPlayers
    });
});
