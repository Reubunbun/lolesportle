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
}
