import withDb from '@shared/infrastructure/withDb';
import GuessService, { InvalidDateKey, PlayerNotFound } from '@shared/services/guessService';
import { createHttpResponse } from '@shared/helpers/httpResponse';

const DB_READONLY = true;
const DB_NEW_CONNECTION = false;

const VALID_REGIONS = ['ALL', 'EU', 'NA', 'CH', 'KR'];

export const handler = withDb(DB_READONLY, DB_NEW_CONNECTION, async(dbConn, event) => {
    const postBody = event.body ? JSON.parse(event.body) : {};
    if (!postBody.guess) {
        return createHttpResponse(400, { message: 'No guess given' });
    }

    if (!postBody.region || !VALID_REGIONS.includes(postBody.region)) {
        return createHttpResponse(400, { message: 'Invalid region' });
    }

    if (!postBody.dateKey) {
        return createHttpResponse(400, { message: 'No dateKey given' });
    }

    const guessService = new GuessService(dbConn);
    try {
        const result = await guessService.makeGuess(
            postBody.guess,
            postBody.region,
            postBody.dateKey,
        );
        return createHttpResponse(200, result);
    } catch (err) {
        console.log(err);

        if (err instanceof PlayerNotFound) {
            return createHttpResponse(404, { message: 'Could not find player' });
        }

        if (err instanceof InvalidDateKey) {
            return createHttpResponse(401, { message: 'Invalid date key' });
        }

        return createHttpResponse(500, { message: 'Something went wrong' });
    }
});
