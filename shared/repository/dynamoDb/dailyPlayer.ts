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
    playerPathAll: string;
    playerPathEU: string;
    playerPathNA: string;
    playerPathCH: string;
    playerPathKR: string;
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
                playerPathAll: { S: dailyPlayer.playerPathAll },
                playerPathEU: { S: dailyPlayer.playerPathEU },
                playerPathNA: { S: dailyPlayer.playerPathNA },
                playerPathCH: { S: dailyPlayer.playerPathCH },
                playerPathKR: { S: dailyPlayer.playerPathKR },
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

        return (result.Items || []).map(row => ({
            date: row.date.S!,
            playerPathAll: row.playerPathAll.S!,
            playerPathEU: row.playerPathEU.S!,
            playerPathNA: row.playerPathNA.S!,
            playerPathCH: row.playerPathCH.S!,
            playerPathKR: row.playerPathKR.S!,
        }));
    }

    async getByDate(date: string) : Promise<DailyPlayerRow | null> {
        const result = await this._dbClient.send(new QueryCommand({
            TableName: DailyPlayer.TABLE_NAME,
            KeyConditionExpression: 'pk = :pk AND #d = :date',
            ExpressionAttributeNames: {
                '#d': 'date',
            },
            ExpressionAttributeValues: {
                ':pk': { S: 'dailyPlayer' },
                ':date': { S: date },
            },
            Limit: 1,
        }));

        if (!result.Items || result.Items.length === 0) {
            return null;
        }

        const row = result.Items[0];
        return {
            date: row.date.S!,
            playerPathAll: row.playerPathAll.S!,
            playerPathEU: row.playerPathEU.S!,
            playerPathNA: row.playerPathNA.S!,
            playerPathCH: row.playerPathCH.S!,
            playerPathKR: row.playerPathKR.S!,
        };
    }
}
