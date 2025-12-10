import { type Tables } from 'knex/types/tables';
import Repository from './abstract';

export type TournamentRow = Tables['tournaments'];

export default class Tournaments extends Repository {
    async upsertMultiple(rows: Omit<TournamentRow, 'id'>[]) {
        this._db('tournaments')
            .insert(rows)
            .onConflict('path_name')
            .merge([
                'name',
                'alt_names',
                'series',
                'start_date',
                'end_date',
                'no_participants',
            ]);
    }

    async getMultipleNotChecked(limit: number) {
        return await this._db('tournaments')
            .select('page_id', 'no_participants')
            .where('has_been_checked', false)
            .limit(limit);
    }

    async setHasBeenCheckedForPageIds(pageIds: number[]) {
        await this._db('tournaments')
            .whereIn('page_id', pageIds)
            .update('has_been_checked', true);
    }

    async getMultipleByPaths(paths: string[]) {
        return await this._db('tournaments')
            .select('*')
            .whereIn('path_name', paths);
    }
}
