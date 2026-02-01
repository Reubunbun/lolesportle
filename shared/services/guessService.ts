import DailyPlayer from '@shared/repository/dynamoDb/dailyPlayer';
import {
    Players as PlayersRepository,
    Teams as TeamsRepository,
    Tournaments as TournamentsRepository,
    TournamentResults as TournamentResultsRepository,
} from '@shared/repository/sqlite';
import PlayerProfile from '@shared/domain/playerProfile';

export const VALID_REGIONS = ['ALL', 'ALL_HARD', 'EU', 'NA', 'CH', 'KR'] as const;
export type ValidRegions = typeof VALID_REGIONS[number];

export class PlayerNotFound extends Error {};
export class InvalidDateKey extends Error {};

type Dependencies = {
    playersRepo: PlayersRepository,
    teamsRepo: TeamsRepository,
    tournamentRepo: TournamentsRepository,
    tournamentResultsRepo: TournamentResultsRepository,
    dailyPlayerRepo: DailyPlayer,
};

export default class GuessService {
    constructor(private _deps: Dependencies) {}

    private async _constructPlayerProfile(playerPath: string) {
        const playerRow = await this._deps.playersRepo.getByPath(playerPath);
        if (!playerRow) {
            throw new PlayerNotFound();
        }

        const resultRows = await this._deps.tournamentResultsRepo.getMultipleByPlayer(playerPath);
        const teamRows = await this._deps.teamsRepo.getMultipleByPaths(resultRows.map(r => r.team_path));
        const tournamentRows = await this._deps.tournamentRepo.getMultipleByPaths(resultRows.map(r => r.tournament_path));

        return new PlayerProfile(
            playerRow,
            teamRows,
            tournamentRows,
            resultRows,
        );
    }

    async makeGuess(
        guessedPlayerPath: string,
        region: ValidRegions,
        dateKey: string,
    ) {
        const todaysPlayers = await this._deps.dailyPlayerRepo.getByDate(dateKey);

        if (!todaysPlayers) {
            throw new InvalidDateKey();
        }

        const [correctPlayerProfile, guessedPlayerProfile] = await Promise.all([
            this._constructPlayerProfile((() => {
                switch (region) {
                    case 'ALL': return todaysPlayers.playerPathAll.path;
                    case 'ALL_HARD': return todaysPlayers.playerPathHard.path;
                    case 'EU': return todaysPlayers.playerPathEU.path;
                    case 'NA': return todaysPlayers.playerPathNA.path;
                    case 'CH': return todaysPlayers.playerPathCH.path;
                    case 'KR': return todaysPlayers.playerPathKR.path;
                }
            })()),
            this._constructPlayerProfile(guessedPlayerPath),
        ]);

        return guessedPlayerProfile.guessAgainst(correctPlayerProfile);
    }
}
