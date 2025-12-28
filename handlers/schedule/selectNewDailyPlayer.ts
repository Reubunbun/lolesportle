import DailyPlayerService from '@shared/services/dailyPlayerService';
import withDb from '@shared/infrastructure/withDb';

const DB_READONLY = true;
const DB_NEW_CONNECTION = true;

export const handler = withDb(DB_READONLY, DB_NEW_CONNECTION, async (dbConn) => {
    const dailyPlayerService = new DailyPlayerService(dbConn);
    await dailyPlayerService.insertPlayersOfTheDay();
});
