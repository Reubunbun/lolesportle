import Knex from 'knex';
import {  Players as PlayersRepository } from '@shared/repository/sqlite';

export default class PlayersService {
    private _dbConn: Knex.Knex;

    constructor(dbConn: Knex.Knex) {
        this._dbConn = dbConn;
    }

    async searchPlayers(searchTerm: string) {
        const playerRepo = new PlayersRepository(this._dbConn);
        return playerRepo.getMultipleBySearchTerm(searchTerm);
    }
}
