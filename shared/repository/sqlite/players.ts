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

        return await this._db('players')
            .select('name', 'path_name')
            .where('name', 'like', likeTerm)
            .orderBy('name', 'asc')
            .limit(25);
    }
}
