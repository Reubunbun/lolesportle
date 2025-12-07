import DailyPlayer from '../shared/helpers/dynamoDb/dailyPlayer';

process.env.AWS_REGION = 'eu-west-1';

if (process.env.NODE_ENV === 'local') {
    process.env.IS_LOCAL = 'true';
}

(async() => {
    // If there was more than one table it'd be a class per table
    const dynamo = new DailyPlayer();
    await dynamo.createTable();
})();
