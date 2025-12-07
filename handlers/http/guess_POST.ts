import { type Tables } from 'knex/types/tables';
import withDb from '@shared/helpers/withDb';
import DailyPlayer from '@shared/repository/dynamoDb/dailyPlayer';

const DB_READONLY = true;
const DB_NEW_CONNECTION = false;

type PlayerProfile = {
    path: string;
    name: string;
    region: {
        current: string;
        historic: string[]
    };
    team: {
        current: string;
        historic: string[];
    };
    role: string[];
    nationalities: string[];
    debut: string;
    greatest_acheivement: Tables['tournament_results'];
};

const GUESS_RESULT = {
    CORRECT: '✅',
    INCORRECT: '❌',
    PARTIAL: '⚠️',
    CORRECT_IS_HIGHER: '⬆️',
    CORRECT_IS_LOWER: '⬇️',
};

export const handler = withDb(DB_READONLY, DB_NEW_CONNECTION, async(dbConn, event) => {
    const postBody = event.body ? JSON.parse(event.body) : {};
    if (!postBody.guess) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'No guess given' }),
        };
    }



    const dailyPlayerTable = new DailyPlayer();
    const todaysPlayer = (await dailyPlayerTable.getMostRecentPlayers(1))[0];

});
