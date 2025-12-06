import Knex from 'knex';
import S3 from './s3';

export default function withDb(handler: (dbConn: Knex.Knex) => Promise<void>) {
  return async function() {
    const config: Knex.Knex.Config = {
      client: 'sqlite3',
      useNullAsDefault: true,
    };

    const s3 = new S3();
    const isProd = !process.env.IS_LOCAL;

    if (!isProd) {
      config.connection = { filename: '../../database/dev.sqlite3' };
    } else {
      await s3.downloadFile(
        process.env.STORAGE_BUCKET!,
        'database/db.sqlite3',
        '/tmp/prod.sqlite3',
      );
      config.connection = { filename: '/tmp/prod.sqlite3' };
    }

    const knex = Knex(config);

    try {
      await handler(knex);
    } catch (e) {
      console.error(e);
    } finally {
      await knex.destroy();

      await s3.uploadFile('/tmp/prod.sqlite3', process.env.STORAGE_BUCKET!, 'database/db.sqlite3');
    }
  };
}
