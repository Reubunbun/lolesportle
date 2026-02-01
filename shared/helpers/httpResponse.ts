export const createHttpResponse = (statusCode: number, body: Record<string, any>) => ({
    statusCode,
    headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
});
