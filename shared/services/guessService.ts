import Knex from 'knex';
import DailyPlayer from '@shared/repository/dynamoDb/dailyPlayer';
import {
    Players as PlayersRepository,
    Teams as TeamsRepository,
    Tournaments as TournamentsRepository,
    TournamentResults as TournamentResultsRepository,
} from '@shared/repository/sqlite';
import PlayerProfile from '@shared/domain/playerProfile';

type ValidRegions = 'ALL' | 'ALL_HARD' | 'EU' | 'NA' | 'CH' | 'KR';

export class PlayerNotFound extends Error {};
export class InvalidDateKey extends Error {};

export default class GuessService {
    private _dbConn: Knex.Knex;

    constructor(dbConn: Knex.Knex) {
        this._dbConn = dbConn;
    }

    private async _constructPlayerProfile(playerPath: string) {
        const playerRepo = new PlayersRepository(this._dbConn);
        const teamRepo = new TeamsRepository(this._dbConn);
        const tournamentRepo = new TournamentsRepository(this._dbConn);
        const tournamentResultRepo = new TournamentResultsRepository(this._dbConn);

        const playerRow = await playerRepo.getByPath(playerPath);
        if (!playerRow) {
            throw new PlayerNotFound();
        }

        const resultRows = await tournamentResultRepo.getMultipleByPlayer(playerPath);
        const teamRows = await teamRepo.getMultipleByPaths(resultRows.map(r => r.team_path));
        const tournamentRows = await tournamentRepo.getMultipleByPaths(resultRows.map(r => r.tournament_path));

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
        const dailyPlayerRepo = new DailyPlayer();
        const todaysPlayers = await dailyPlayerRepo.getByDate(dateKey);

        if (!todaysPlayers) {
            throw new InvalidDateKey();
        }

        const [correctPlayerProfile, guessedPlayerProfile] = await Promise.all([
            this._constructPlayerProfile((() => {
                switch (region) {
                    case 'ALL': return todaysPlayers.playerPathAll;
                    case 'ALL_HARD': return todaysPlayers.playerPathHard;
                    case 'EU': return todaysPlayers.playerPathEU;
                    case 'NA': return todaysPlayers.playerPathNA;
                    case 'CH': return todaysPlayers.playerPathCH;
                    case 'KR': return todaysPlayers.playerPathKR;
                }
            })()),
            this._constructPlayerProfile(guessedPlayerPath),
        ]);

        return guessedPlayerProfile.guessAgainst(correctPlayerProfile);
    }
}
