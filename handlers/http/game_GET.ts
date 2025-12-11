import DailyPlayerService from '@shared/services/dailyPlayerService';

export const handler = async () => {
    const service = new DailyPlayerService();
    const result = await service.getCurrentDateKey();
    return {
        statusCode: 200,
        body: JSON.stringify({ gameKey: result }),
    };
};
