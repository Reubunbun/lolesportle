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

    async getMultipleBySearchTerm(searchTerm: string): Promise<Pick<PlayerRow, 'name' | 'path_name'>[]> {
        const likeTerm = searchTerm.length >= 3 ? `%${searchTerm}%` : `${searchTerm}%`;

        return await this._db('players as p')
            .distinct('p.name', 'p.path_name')
            .innerJoin('tournament_results', 'p.path_name', 'tournament_results.player_path')
            .innerJoin('tournaments', 'tournament_results.tournament_path', 'tournaments.path_name')
            .where('p.name', 'like', likeTerm)
            .where('tournaments.region', '!=', 'International')
            .where('tournaments.tier', '=', 1)
            .orderBy('p.name', 'asc')
            .limit(10);
    }

    async getMultipleLastPlayedForteam(teamName: string): Promise<Pick<PlayerRow, 'name' | 'path_name'>[]> {
        return await this._db('teams as tm')
            .distinct('p.name', 'p.path_name')
            .join('tournament_results as tr', 'tm.path_name', 'tr.team_path')
            .join('tournaments as t', 't.path_name', 'tr.tournament_path')
            .join('players as p', 'p.path_name', 'tr.player_path')
            .whereRaw(
                '(LOWER(tm.name) = ? OR LOWER(tm.name) LIKE ? OR LOWER(tm.name) LIKE ?)',
                [teamName.toLowerCase(), `% ${teamName.toLowerCase()}`, `${teamName.toLowerCase()} %`],
            )
            .where('t.start_date', '=', this._db
                .select(this._db.raw('MAX(t2.start_date)'))
                .from('tournament_results as tr2')
                .join('tournaments as t2', 't2.path_name', 'tr2.tournament_path')
                .whereRaw('tr2.team_path = tm.path_name')
                .whereRaw('t2.tier = 1')
            )
            .orderBy('p.name', 'asc')
            .limit(10);
    }
}
