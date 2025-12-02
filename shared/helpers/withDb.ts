import Knex from 'knex';

export default function withDb(handler: (dbConn: Knex.Knex) => Promise<void>) {
  return async function() {
    const knex = Knex({
      client: 'mysql2',
      connection: {
        host: process.env.DB_HOST!,
        port: +process.env.DB_PORT!,
        user: process.env.DB_USER!,
        password: process.env.DB_PASSWORD!,
        database: process.env.DB_NAME!,
      },
    });

    try {
      await handler(knex);
    } catch (e) {
      console.error(e);
    } finally {
      await knex.destroy();
    }
  };
}
