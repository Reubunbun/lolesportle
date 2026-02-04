import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { createHttpResponse } from '@shared/helpers/httpResponse';

const ses = new SESClient({ region: process.env.AWS_REGION });

export const handler: APIGatewayProxyHandlerV2  = async (event) => {
    const reportMessage = JSON.parse(event.body || '{}').message;

    if (!reportMessage) {
        return createHttpResponse(400, { error: 'missing message' });
    }

    if (reportMessage.length > 300) {
        return createHttpResponse(400, { error: 'message is too long' });
    }

    await ses.send(new SendEmailCommand({
        Source: process.env.REPORT_EMAIL!,
        Destination: {
            ToAddresses: [process.env.REPORT_EMAIL!],
        },
        Message: {
            Subject: {
                Data: 'Report from lolesportle',
            },
            Body: {
                Text: {
                    Data: reportMessage,
                },
            },
        },
    }));

    return createHttpResponse(201, {});
};
