import { type Tables } from 'knex/types/tables';
import Repository from './abstract';

export type TournamentRow = Tables['tournaments'];

export default class Tournaments extends Repository {
    async upsertMultiple(rows: Omit<TournamentRow, 'id'>[]) {
        await this._db('tournaments')
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
            .select('page_id', 'no_participants', 'end_date')
            .where('has_been_checked', false)
            .orderBy('time_checked', 'asc')
            .limit(limit);
    }

    async setHasBeenChecked(pageId: number, fullyChecked: boolean) {
        await this._db('tournaments')
            .where('page_id', pageId)
            .update({
                has_been_checked: fullyChecked,
                time_checked: Math.floor(Date.now() / 1000),
            });
    }

    async getMultipleByPaths(paths: string[]) {
        return await this._db('tournaments')
            .select('*')
            .whereIn('path_name', paths);
    }

    async getMultipleSTierEndedAfterDate(endDate?: string) {
        const q = this._db('tournaments').select('*');

        if (endDate) {
            q.where('end_date', '>', endDate);
        }

        return await q.where('tier', 1);
    }
}
