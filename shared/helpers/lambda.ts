import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

export default class Lambda {
    private _client: LambdaClient;

    constructor() {
        this._client = new LambdaClient({ region: process.env.AWS_REGION! });
    }

    async invokeCreateJsonDump() {
        await this._client.send(
            new InvokeCommand({
                FunctionName: process.env.CREATE_JSON_DUMP_ARN!,
                InvocationType: 'Event',
            }),
        );
    }
}
