import {
    DynamoDBClient,
    DescribeTableCommand,
    CreateTableCommand,
} from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';

type PlayerData = {
    path: string;
    hints: {
        tournament: string;
        team: string;
        player: string;
    };
};
type DailyPlayerRow = {
    pk?: string;
    date: string;
    playerPathAll: PlayerData;
    playerPathHard: PlayerData;
    playerPathEU: PlayerData;
    playerPathNA: PlayerData;
    playerPathCH: PlayerData;
    playerPathKR: PlayerData;
};

export default class DailyPlayer {
    private _dbClient: DynamoDBDocumentClient;

    static readonly TABLE_NAME = 'DailyPlayer';

    constructor() {
        this._dbClient = DynamoDBDocumentClient.from(
            new DynamoDBClient({
                region: process.env.AWS_REGION!,
                endpoint: process.env.IS_LOCAL
                    ? 'http://localhost:8000'
                    : undefined,
            }),
        );
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
        this._dbClient.send(new PutCommand({
            TableName: DailyPlayer.TABLE_NAME,
            Item: {
                pk: 'dailyPlayer',
                date: dailyPlayer.date,
                playerPathAll: dailyPlayer.playerPathAll,
                playerPathHard: dailyPlayer.playerPathHard,
                playerPathEU: dailyPlayer.playerPathEU,
                playerPathNA: dailyPlayer.playerPathNA,
                playerPathCH: dailyPlayer.playerPathCH,
                playerPathKR: dailyPlayer.playerPathKR,
            },
            ConditionExpression: 'attribute_not_exists(pk) AND attribute_not_exists(#d_attr_not_exists)',
            ExpressionAttributeNames: {
              '#d_attr_not_exists': 'date',
            },
        }));
    }

    async getMostRecentPlayers(limit: number = 1) : Promise<DailyPlayerRow[]> {
        const result = await this._dbClient.send(new QueryCommand({
            TableName: DailyPlayer.TABLE_NAME,
            KeyConditionExpression: 'pk = :pk',
            ExpressionAttributeValues: {
                ':pk': 'dailyPlayer',
            },
            ScanIndexForward: false,
            Limit: limit,
        }));

        return (result.Items || []).map(row => ({
            date: row.date,
            playerPathAll: row.playerPathAll,
            playerPathHard: row.playerPathHard,
            playerPathEU: row.playerPathEU,
            playerPathNA: row.playerPathNA,
            playerPathCH: row.playerPathCH,
            playerPathKR: row.playerPathKR,
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
                ':pk': 'dailyPlayer',
                ':date': date,
            },
            Limit: 1,
        }));

        if (!result.Items || result.Items.length === 0) {
            return null;
        }

        const row = result.Items[0];
        return {
            date: row.date,
            playerPathAll: row.playerPathAll,
            playerPathHard: row.playerPathHard,
            playerPathEU: row.playerPathEU,
            playerPathNA: row.playerPathNA,
            playerPathCH: row.playerPathCH,
            playerPathKR: row.playerPathKR,
        };
    }
}
