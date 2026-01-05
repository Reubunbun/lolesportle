import DailyPlayerService from '@shared/services/dailyPlayerService';

export const handler = async () => {
    const service = new DailyPlayerService();
    const currentGameKey = await service.getCurrentDateKey();
    const yesterdaysPlayers = await service.getPreviousPlayers();

    return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ gameKey: currentGameKey, previousPlayers: yesterdaysPlayers }),
    };
};
