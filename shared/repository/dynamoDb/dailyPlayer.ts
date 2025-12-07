import { v4 as uuidv4 } from 'uuid';
import {
    DynamoDBClient,
    DescribeTableCommand,
    CreateTableCommand,
    PutItemCommand,
    QueryCommand,
} from '@aws-sdk/client-dynamodb';

type DailyPlayerRow = {
    pk?: string;
    date: string;
    playerPath: string;
};

export default class DailyPlayer {
    private _dbClient: DynamoDBClient;

    static readonly TABLE_NAME = 'DailyPlayer';

    constructor() {
        this._dbClient = new DynamoDBClient({
            region: process.env.AWS_REGION!,
            endpoint: process.env.IS_LOCAL
                ? 'http://localhost:8000'
                : undefined,
        });
    }

    private async _tableExists() {
        try {
            await this._dbClient.send(new DescribeTableCommand({
                TableName: DailyPlayer.TABLE_NAME,
            }));
            return true;
        } catch (err: any) {
            if (err.name === 'ResourceNotFoundException') return false;
            throw err;
        }
    }

    async createTable() {
        const alreadyCreated = await this._tableExists();
        if (alreadyCreated) {
            return;
        }

        console.log(`Creating ${DailyPlayer.TABLE_NAME}...`);

        await this._dbClient.send(new CreateTableCommand({
            TableName: DailyPlayer.TABLE_NAME,
            AttributeDefinitions: [
                { AttributeName: 'pk', AttributeType: 'S' },
                { AttributeName: 'date', AttributeType: 'S' },
            ],
            KeySchema: [
                { AttributeName: 'pk', KeyType: 'HASH' },
                { AttributeName: 'date', KeyType: 'RANGE' },
            ],
            BillingMode: 'PAY_PER_REQUEST',
        }));
    }

    async insert(dailyPlayer: DailyPlayerRow) {
        this._dbClient.send(new PutItemCommand({
            TableName: DailyPlayer.TABLE_NAME,
            Item: {
                pk: { S: 'dailyPlayer' },
                date: { S: dailyPlayer.date },
                playerPath: { S: dailyPlayer.playerPath },
            },
            ConditionExpression: 'attribute_not_exists(pk) AND attribute_not_exists(#d_attr_not_exists)',
            ExpressionAttributeNames: {
              "#d_attr_not_exists": "date",
            },
        }));
    }

    async getMostRecentPlayers(limit: number = 1) : Promise<DailyPlayerRow[]> {
        const result = await this._dbClient.send(new QueryCommand({
            TableName: DailyPlayer.TABLE_NAME,
            KeyConditionExpression: 'pk = :pk',
            ExpressionAttributeValues: {
                ':pk': { S: 'dailyPlayer' },
            },
            ScanIndexForward: false,
            Limit: limit,
        }));

        return (result.Items as unknown) as DailyPlayerRow[];
    }
}
