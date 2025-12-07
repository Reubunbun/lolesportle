import Knex from 'knex';
import Fs from 'fs';
import S3 from './s3';

const LOCAL_DB_PATH = '/tmp/prod.sqlite3';

let db: Knex.Knex;

export default function withDb(readonly: boolean, forceNewConnection: boolean, handler: (dbConn: Knex.Knex) => Promise<void>) {
  return async function() {
    const config: Knex.Knex.Config = {
      client: 'sqlite3',
      useNullAsDefault: true,
    };

    const s3 = new S3();
    const isProd = !process.env.IS_LOCAL;

    if (isProd) {
      config.connection = { filename: LOCAL_DB_PATH };

      const alreadyDownloaded = Fs.existsSync(LOCAL_DB_PATH);

      if (!alreadyDownloaded || forceNewConnection) {
        await s3.downloadToFile(
          process.env.DATABASE_KEY!,
          LOCAL_DB_PATH,
        );
      }
    } else {
      config.connection = { filename: '../../database/local.sqlite3' };
    }

    if (!db || forceNewConnection) {
      db = Knex(config);
    }

    try {
      await handler(db);
    } catch (e) {
      console.error(e);
    } finally {
      await db.destroy();

      if (isProd && !readonly) {
        await s3.uploadFromFile(process.env.DATABASE_KEY!, LOCAL_DB_PATH);
      }
    }
  };
}
