import withDb from '@shared/infrastructure/withDb';
import LiquipediaService from '@shared/services/liquipediaService';

const DB_READONLY = false;
const DB_NEW_CONNECTION = true;

export const handler = withDb(DB_READONLY, DB_NEW_CONNECTION, async (dbConn) => {
    const liquipediaService = new LiquipediaService(dbConn);
    await liquipediaService.gatherTournamentData();
});
