import type { Knex } from 'knex';

const shared: Partial<Knex.Config> = {
    client: 'sqlite3',
    useNullAsDefault: true,
    migrations: {
        directory: `${__dirname}/migrations`,
        extension: 'ts',
    },
};

const config: { [key: string]: Knex.Config } = {
    local: {
        ...shared,
        connection: { filename: `${__dirname}/local.sqlite3` },
    },
    prod: {
        ...shared,
        connection: { filename: `${__dirname}/prod.sqlite3` },
    }
};

export default config;
