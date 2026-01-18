import { type Tables } from 'knex/types/tables';
import Repository from './abstract';

export type TeamRow = Tables['teams'];

export default class Teams extends Repository {
    async getMultipleByPaths(paths: string[]) {
        return await this._db('teams')
            .select('*')
            .whereIn('path_name', paths);
    }

    async upsertMultiple(rows: Omit<TeamRow, 'id'>[]) {
        await this._db('teams')
            .insert(rows)
            .onConflict([ 'path_name' ])
            .merge([ 'path_name', 'name' ]);
    }

    async getByPath(path: string) {
        return await this._db('teams').select('*').where('path_name', path).first();
    }
}
