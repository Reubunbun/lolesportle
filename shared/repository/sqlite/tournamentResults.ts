import { type Tables } from 'knex/types/tables';
import Repository from './abstract';

export type TournamentResultRow = Tables['tournament_results'];

export default class TournamentResults extends Repository {
    async upsertMultiple(rows: Omit<TournamentResultRow, 'id'>[]) {
        await this._db('tournament_results')
            .insert(rows)
            .onConflict(['tournament_path', 'player_path', 'team_path'])
            .merge([ 'position', 'beat_percent', 'liquipedia_weight' ]);
    }

    async getMultipleByPlayer(playerPath: string) {
        return await this._db('tournament_results')
            .select('*')
            .where('player_path', playerPath);
    }

    async getMultipleByTournaments(tournamentPaths: string[]) {
        return await this._db('tournament_results')
            .select('*')
            .whereIn('tournament_path', tournamentPaths);
    }

     async getMultipleByPlayerOrderedByTournamentStart(playerPath: string): Promise<TournamentResultRow[]> {
        return await this._db('tournament_results')
            .select('tournament_results.*', 'tournaments.start_date')
            .innerJoin('tournaments', 'tournament_results.tournament_path', 'tournaments.path_name')
            .where('tournament_results.player_path', playerPath)
            .where('tournaments.tier', 1)
            .orderBy('tournaments.start_date', 'desc');
    }

    async getPlayersByTournmantAndTeam(tournamentPath: string, teamPath: string) {
        return await this._db('tournament_results')
            .select('player_path')
            .where('tournament_path', tournamentPath)
            .andWhere('team_path', teamPath);
    }
}
