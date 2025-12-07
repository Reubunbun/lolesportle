import { type Tables } from 'knex/types/tables';
import Repository from './abstract';

type PlayerRow = Tables['players'];

export default class Players extends Repository {
    async getMultipleByPaths(paths: string[]) {
        return await this._db('players')
            .select('page_id', 'path_name')
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

    async appendRoleForPath(path: string, roleToAppend: string) {
        const player = await this._db('players').where('path_name', path).first('roles');
        if (!player) return;

        const currentRoles = JSON.parse(player.roles || '[]') as string[];
        const newRoles = Array.from(new Set([...currentRoles, roleToAppend]));

        await this._db('players')
            .where('path_name', path)
            .update({ roles: JSON.stringify(newRoles) });
    }
}
