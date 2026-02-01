import withDb from '@shared/infrastructure/withDb';
import {
    Players as PlayersRepository,
    Teams as TeamsRespository,
    TournamentResults as TournamentResultsRepository,
    Tournaments as TournamentsRepository,
} from '@shared/repository/sqlite';
import LiquipediaService from '@shared/services/liquipediaService';

const DB_READONLY = false;
const DB_NEW_CONNECTION = true;

export const handler = withDb(DB_READONLY, DB_NEW_CONNECTION, async (dbConn) => {
    const liquipediaService = new LiquipediaService({
        playersRepo: new PlayersRepository(dbConn),
        teamsRepo: new TeamsRespository(dbConn),
        tournamentResultsRepo: new TournamentResultsRepository(dbConn),
        tournamentsRepo: new TournamentsRepository(dbConn),
    });
    await liquipediaService.gatherTournamentData();
});
