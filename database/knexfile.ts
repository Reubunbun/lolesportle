import type { Knex } from "knex";

const shared: Partial<Knex.Config> = {
    migrations: {
        directory: "./migrations",
        extension: "ts",
    },
};

const config: { [key: string]: Knex.Config } = {
    dev: {
        ...shared,
        client: "sqlite3",
        connection: {
            filename: "./dev.sqlite3",
        },
        useNullAsDefault: true,
    },

//   production: {
//         ...shared,
//         client: "sqlite3",
//         connection: {
//             filename: "/tmp/esports.db",
//         },
//         useNullAsDefault: true,
//   }
};

export default config;
