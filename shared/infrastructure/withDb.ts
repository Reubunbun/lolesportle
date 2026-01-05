import { type APIGatewayProxyEvent, type APIGatewayProxyResult } from 'aws-lambda';
import Knex from 'knex';
import path from 'path';
import Fs from 'fs';
import S3 from './s3';

const LOCAL_DB_PATH = '/tmp/prod.sqlite3';

let db: Knex.Knex | undefined;

export default function withDb(
  readonly: boolean,
  forceNewConnection: boolean,
  handler: (dbConn: Knex.Knex, event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult|void>
) {
  return async function(event: APIGatewayProxyEvent) {
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
      config.connection = {
        filename: path.resolve(
          process.cwd(),
          'database/sqlite/local.sqlite3',
        ).replace('.esbuild/.build', '')
      };
    }

    if (!db || forceNewConnection) {
      console.log(config);
      db = Knex(config);
    }

    try {
      return await handler(db, event);
    } catch (e) {
      console.error(e);
    } finally {
      if (forceNewConnection) {
        await db.destroy();
        db = undefined;
      }

      if (isProd && !readonly) {
        await s3.uploadFromFile(process.env.DATABASE_KEY!, LOCAL_DB_PATH);
      }
    }
  };
}
