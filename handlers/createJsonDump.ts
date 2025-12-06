import withDb from '@shared/helpers/withDb';
import { uploadDump, type JsonFiles } from '@shared/helpers/jsonDumps';

export const handler = withDb(async (dbConn) => {
    const allTournaments = await dbConn('tournaments').select([
        'path_name',
        'name',
        'series',
        'start_date',
        'end_date',
        'no_participants',
    ]);

    const tournamentData: JsonFiles['tournaments.json'] = {};
    for (const tournament of allTournaments) {
        tournamentData[tournament.path_name] = tournament;
    }

    await uploadDump('tournaments.json', tournamentData);

    const yearNow = (new Date()).getUTCFullYear();
    const tournamentCutoff = yearNow - 2;

    const recentTournaments = allTournaments
        .filter(tournament => new Date(tournament.start_date).getUTCFullYear() >= tournamentCutoff)
        .map(tournament => tournament.path_name);

    const allTournamentResults = await dbConn('tournament_results').select([
        'tournament_path',
        'player_path',
        'team_path',
        'position',
        'beat_percent',
        'liquipedia_weight',
    ]);

    const relevantPlayers = new Set<string>();
    const relevantTeams = new Set<string>();

    for (const result of allTournamentResults) {
        if (recentTournaments.includes(result.tournament_path)) {
            relevantPlayers.add(result.player_path);
            relevantTeams.add(result.team_path);
        }
    }

    // Only care about results involving players and teams that competed in the last 2 years
    const resultsDataByPlayer: JsonFiles['resultsByPlayer.json'] = {};
    const resultsDataByTeam: JsonFiles['resultsByTeam.json'] = {};
    for (const result of allTournamentResults) {
        if (relevantPlayers.has(result.player_path)) {
            resultsDataByPlayer[result.player_path] =
                [...(resultsDataByPlayer[result.player_path] || []), result];
        }

        if (relevantTeams.has(result.team_path)) {
            resultsDataByTeam[result.team_path] =
                [...(resultsDataByTeam[result.team_path] || []), result];
        }
    }

    await uploadDump('resultsByPlayer.json', resultsDataByPlayer);
    await uploadDump('resultsByTeam.json', resultsDataByTeam);

    const allPlayers = await dbConn('players').select([
        'path_name',
        'name',
        'alt_names',
        'nationalities',
        'signature_champions',
        'birth_date',
        'roles',
    ]);

    const playerData: JsonFiles['players.json'] = {};
    for (const player of allPlayers) {
        if (relevantPlayers.has(player.path_name)) {
            playerData[player.path_name] = player;
        }
    }

    await uploadDump('players.json', playerData);

    const allTeams = await dbConn('teams').select([ 'path_name', 'name' ]);

    const teamData: JsonFiles['teams.json'] = {};
    for (const team of allTeams) {
        if (relevantTeams.has(team.path_name)) {
            teamData[team.path_name] = team;
        }
    }

    await uploadDump('teams.json', teamData);
});
