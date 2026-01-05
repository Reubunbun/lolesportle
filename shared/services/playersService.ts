import Knex from 'knex';
import {  Players as PlayersRepository } from '@shared/repository/sqlite';

export default class PlayersService {
    private _dbConn: Knex.Knex;

    constructor(dbConn: Knex.Knex) {
        this._dbConn = dbConn;
    }

    async searchPlayers(searchTerm: string) {
        const playerRepo = new PlayersRepository(this._dbConn);
        const playerMatches = await playerRepo.getMultipleBySearchTerm(searchTerm);

        // Check for any names that appear more than once
        const nameToCount: Record<string, number> = {};
        for (const { name } of playerMatches) {
            if (!(name in nameToCount)) {
                nameToCount[name] = 1;
                continue;
            }

            nameToCount[name]++;
        }

        for (const player of playerMatches) {
            const { name, path_name } = player;

            if (nameToCount[name] > 1) {
                player.name = path_name.replace(/_/g, ' ');
            }
        }

        return playerMatches;
    }
}
