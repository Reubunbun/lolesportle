import withDb from '@shared/infrastructure/withDb';
import GuessService, { PlayerNotFound } from '@shared/services/guessService';

const DB_READONLY = true;
const DB_NEW_CONNECTION = false;

export const handler = withDb(DB_READONLY, DB_NEW_CONNECTION, async(dbConn, event) => {
    const postBody = event.body ? JSON.parse(event.body) : {};
    if (!postBody.guess) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'No guess given' }),
        };
    }

    const guessService = new GuessService(dbConn);
    try {
        const result = await guessService.makeGuess(postBody.guess);
        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify(result),
        };
    } catch (err) {
        console.log(err);

        if (err instanceof PlayerNotFound) {
            return {
                statusCode: 404,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ message: 'Could not find player' }),
            };
        }

        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ message: 'Something went wrong' }),
        };
    }
});
