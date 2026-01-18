import DailyPlayerService from '@shared/services/dailyPlayerService';

export const handler = async () => {
    const service = new DailyPlayerService();
    const { gameKey, hints } = await service.getCurrentDateKeyAndHints();
    const yesterdaysPlayers = await service.getPreviousPlayers();

    return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
            gameKey,
            hints,
            previousPlayers: yesterdaysPlayers
        }),
    };
};
