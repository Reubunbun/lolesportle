import { type Tables } from 'knex/types/tables';
import Repository from './abstract';

export type PlayerRow = Tables['players'];

export default class Players extends Repository {
    async getByPath(path: string) {
        return await this._db('players').select('*').where('path_name', path).first();
    }

    async getMultipleByPaths(paths: string[]) {
        return await this._db('players')
            .select('*')
            .whereIn('path_name', paths);
    }

    async upsertMultiple(rows: Omit<PlayerRow, 'id'>[]) {
        await this._db('players')
            .insert(rows)
            .onConflict('path_name')
            .merge([
                'name',
                'alt_names',
                'birth_date',
                'birth_date',
                'nationalities',
                'signature_champions',
            ]);
    }

    async getMultipleBySearchTerm(searchTerm: string) {
        const likeTerm = searchTerm.length >= 3 ? `%${searchTerm}%` : `${searchTerm}%`;

        return await this._db('players as p')
            .distinct('p.name', 'p.path_name')
            .innerJoin('tournament_results', 'p.path_name', 'tournament_results.player_path')
            .innerJoin('tournaments', 'tournament_results.tournament_path', 'tournaments.path_name')
            .where('p.name', 'like', likeTerm)
            .where('tournaments.region', '!=', 'International')
            .orderBy('p.name', 'asc')
            .limit(10);
    }
}
