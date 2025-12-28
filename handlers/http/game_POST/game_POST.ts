import { type APIGatewayProxyResult } from 'aws-lambda';
import withDb from '@shared/infrastructure/withDb';
import GuessService, { PlayerNotFound } from '@shared/services/guessService';

const DB_READONLY = true;
const DB_NEW_CONNECTION = false;

const VALID_REGIONS = ['ALL', 'EU', 'NA', 'CH', 'KR'];

export const handler = withDb(DB_READONLY, DB_NEW_CONNECTION, async(dbConn, event) => {
    const postBody = event.body ? JSON.parse(event.body) : {};
    if (!postBody.guess) {
        return {
            statusCode: 400,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ message: 'No guess given' }),
        };
    }

    if (!postBody.region || !VALID_REGIONS.includes(postBody.region)) {
        return {
            statusCode: 400,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ message: 'Invalid region' }),
        };
    }

    const guessService = new GuessService(dbConn);
    try {
        const result = await guessService.makeGuess(postBody.guess, postBody.region);
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
