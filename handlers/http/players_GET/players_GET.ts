import withDb from '@shared/infrastructure/withDb';
import PlayersService from '@shared/services/playersService';
import { createHttpResponse } from '@shared/helpers/httpResponse';

const DB_READONLY = true;
const DB_NEW_CONNECTION = false;

export const handler = withDb(DB_READONLY, DB_NEW_CONNECTION, async(dbConn, event) => {
    const queryParams = event.queryStringParameters || {};
    if (!queryParams.q || queryParams.q.trim().length === 0) {
        return createHttpResponse(400, { message: 'No search term given' });
    }

    const playersService = new PlayersService(dbConn);
    try {
        const results = await playersService.searchPlayers(queryParams.q.trim());
        return createHttpResponse(200, { results });
    } catch (e) {
        console.error(e);
        return createHttpResponse(500, { message: 'Internal server error' });
    }
});
