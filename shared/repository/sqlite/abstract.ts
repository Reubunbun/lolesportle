import Knex from 'knex';

export default abstract class Repository {
    protected _db: Knex.Knex;

    constructor(dbConn: Knex.Knex) {
        this._db = dbConn;
    }
}
