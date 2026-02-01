import { getSeriesFromTournamentPath, type Tier1Region } from '@shared/domain/tournamentSeries';
import {
    TournamentResults as TournamentResultsRepository,
    Tournaments as TournamentsRepository,
    Players as PlayersRepository,
    Teams as TeamsRepository,
} from '@shared/repository/sqlite';
import { type PlayerRow } from '@shared/repository/sqlite/players';

type Dependencies = {
    tournamentResultsRepo: TournamentResultsRepository,
    tournamentsRepo: TournamentsRepository,
    playersRepo: PlayersRepository,
    teamsRepo: TeamsRepository,
}

export default class PlayerSelectService {
    constructor(private _deps: Dependencies) {}

    async getRandomPlayerForRegion(
        excludePlayerPaths: string[],
        minTournamentDate?: string,
        region?: Tier1Region
    ) {
        const recentTournaments = (await this._deps.tournamentsRepo.getMultipleSTierEndedAfterDate(minTournamentDate))
            .filter(tournament => {
                if (!region) {
                    return tournament.region !== 'International';
                }

                return tournament.region === region;
            });

        const playersInRecentTournaments = await this._deps.tournamentResultsRepo.getMultipleByTournaments(
            recentTournaments.map(t => t.path_name),
        );

        const uniquePlayerOptions = Array.from(new Set(
            playersInRecentTournaments.map(tr => tr.player_path),
        ));

        let validPlayerRows = await this._deps.playersRepo.getMultipleByPaths(uniquePlayerOptions);
        validPlayerRows = validPlayerRows.filter(player => JSON.parse(player.roles).length > 0);

        let randomResult: PlayerRow;

        do {
            randomResult = validPlayerRows.sort(() => Math.random() > 0.5 ? -1 : 1).pop()!;
        } while (excludePlayerPaths.includes(randomResult.path_name))

        return randomResult.path_name;
    }

    async getHintsForPlayer(playerPath: string) {
        const allResults = (await this._deps.tournamentResultsRepo.getMultipleByPlayerOrderedByTournamentStart(playerPath))
            .filter(r => (getSeriesFromTournamentPath(r.tournament_path)?.Importance || 0) > 0);

        if (allResults.length > 1) {
            allResults.shift(); // Get rid of most recent result
        }

        allResults.sort(() => Math.random() > 0.5 ? -1 : 1);

        const resultForTeamHint = allResults.length > 1 ? allResults.pop()! : allResults[0];
        const resultForTournamentHint = allResults.length > 1 ? allResults.pop()! : allResults[0];
        // Try to get a player they played with from a different team to that of the team hint
        const resultsForOtherTeams = allResults.filter(r => r.team_path !== resultForTeamHint.team_path);
        const resultForPlayerHint = resultsForOtherTeams.length > 0
            ? resultsForOtherTeams[0]
            : allResults[0];

        console.dir({ resultForTournamentHint, resultForTeamHint, resultForPlayerHint }, { depth: null });

        const tounamentPlayedIn = (await this._deps.tournamentsRepo.getByPath(resultForTournamentHint.tournament_path))!.name;
        const teamPlayedFor = (await this._deps.teamsRepo.getByPath(resultForTeamHint.team_path))!.name;
        const playerPathsPlayedWith = await this._deps.tournamentResultsRepo.getPlayersByTournmantAndTeam(
            resultForPlayerHint.tournament_path,
            resultForPlayerHint.team_path,
        );
        const playerPathPlayedWith = playerPathsPlayedWith
            .map(p => p.player_path)
            .filter(p => p !== playerPath)
            .sort(() => Math.random() > 0.5 ? -1 : 1)[0];
        const playerPlayedWith = (await this._deps.playersRepo.getByPath(playerPathPlayedWith))!.name;

        return {
            tournamentHint: tounamentPlayedIn,
            teamHint: teamPlayedFor,
            playerHint: playerPlayedWith,
        };
    }
}
