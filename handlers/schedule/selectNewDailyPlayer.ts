import DailyPlayer from '@shared/repository/dynamoDb/dailyPlayer';
import { getSeriesFromTournamentPath } from '@shared/helpers/tournamentData';
import withDb from '@shared/infrastructure/withDb';

const DB_READONLY = true;
const DB_NEW_CONNECTION = true;

export const handler = withDb(DB_READONLY, DB_NEW_CONNECTION, async (dbConn) => {
    const dailyPlayerTable = new DailyPlayer();
    const lastWeekOfPlayers = await dailyPlayerTable.getMostRecentPlayers(7);
    const excludePlayerPaths = lastWeekOfPlayers.map(row => row.playerPath);

    const yearNow = (new Date()).getUTCFullYear();
    const minDateEnded = `${yearNow - 2}-01-01`;

    const recentTournaments = (await dbConn('tournaments')
        .select('path_name')
        .where('end_date', '>', minDateEnded))
        .filter(tournament => getSeriesFromTournamentPath(tournament.path_name)?.Region !== 'International');

    const playersInRecentTournaments = await dbConn('tournament_results')
        .select('player_path')
        .whereIn('tournament_path', recentTournaments.map(t => t.path_name));

    const uniquePlayerOptions = Array.from(new Set(
        playersInRecentTournaments.map(tr => tr.player_path),
    ));

    let randomResult: string;

    do {
        randomResult = uniquePlayerOptions.sort(() => Math.random() > 0.5 ? -1 : 1).pop()!;
    } while (excludePlayerPaths.includes(randomResult))

    console.log({ randomResult });

    await dailyPlayerTable.insert({
        date: (new Date()).toISOString().split('T')[0],
        playerPath: randomResult,
    });
});
