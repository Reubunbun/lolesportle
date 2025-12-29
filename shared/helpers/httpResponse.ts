export const createHttpResponse = (statusCode: number, body: Record<string, any>) => ({
    statusCode,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(body),
});
