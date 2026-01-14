import Knex from 'knex';
import {  Players as PlayersRepository } from '@shared/repository/sqlite';

export default class PlayersService {
    private _dbConn: Knex.Knex;

    constructor(dbConn: Knex.Knex) {
        this._dbConn = dbConn;
    }

    async searchPlayers(searchTerm: string) {
        const playerRepo = new PlayersRepository(this._dbConn);

        const teamMatches = await playerRepo.getMultipleLastPlayedForteam(searchTerm);
        let nameMatches = await playerRepo.getMultipleBySearchTerm(searchTerm);
        nameMatches = nameMatches.filter(pm => !teamMatches.find(tm => tm.path_name === pm.path_name));

        const allMatches = [ ...teamMatches, ...nameMatches ];

        // Check for any names that appear more than once
        const nameToCount: Record<string, number> = {};
        for (const { name } of allMatches) {
            if (!(name in nameToCount)) {
                nameToCount[name] = 1;
                continue;
            }

            nameToCount[name]++;
        }

        for (const player of allMatches) {
            const { name, path_name } = player;

            if (nameToCount[name] > 1) {
                player.name = path_name.replace(/_/g, ' ');
            }
        }

        return allMatches;
    }
}
