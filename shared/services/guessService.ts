import Knex from 'knex';
import DailyPlayer from '@shared/repository/dynamoDb/dailyPlayer';
import {
    Players as PlayersRepository,
    Teams as TeamsRepository,
    Tournaments as TournamentsRepository,
    TournamentResults as TournamentResultsRepository,
} from '@shared/repository/sqlite';
import PlayerProfile from '@shared/domain/playerProfile';

export class PlayerNotFound extends Error {};

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

    async makeGuess(guessedPlayerPath: string) {
        const dailyPlayerRepo = new DailyPlayer();
        const todaysPlayer = (await dailyPlayerRepo.getMostRecentPlayers(1))[0];
        const [correctPlayerProfile, guessedPlayerProfile] = await Promise.all([
            this._constructPlayerProfile(todaysPlayer.playerPath),
            this._constructPlayerProfile(guessedPlayerPath),
        ]);
        return guessedPlayerProfile.guessAgainst(correctPlayerProfile);
    }
}
