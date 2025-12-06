import Fs from 'fs';
import Yaml from 'js-yaml';
import path from 'path';
import S3 from '../shared/helpers/s3';
import Knex from 'knex';
import knexfile from '../database/knexfile';

const env = (Yaml.load(Fs.readFileSync('.env.yml').toString('utf-8')) as Record<string, any>);
process.env = {
    ...process.env,
    ...env,
    AWS_REGION: 'eu-west-1',
};

const LOCAL_PATH = path.join(__dirname, '..', 'database', 'prod.sqlite3');

(async () => {
    const s3 = new S3();

    const existsOnS3 = await s3.fileExists(env.DATABASE_KEY);
    if (existsOnS3) {
        console.log('Downloading DB from S3...');
        await s3.downloadFile(
            env.DATABASE_KEY,
            LOCAL_PATH,
        );
    } else {
        console.log('Creating new DB...');
        Fs.writeFileSync(LOCAL_PATH, '');
    }

    console.log('Running migrations...');
    const db = Knex(knexfile.prod);
    try {
        await db.migrate.latest();
    } finally {
        await db.destroy();
    }

    console.log('Saving back to S3...');
    await s3.uploadFile(
        env.DATABASE_KEY,
        Fs.readFileSync(LOCAL_PATH),
    );

    Fs.unlinkSync(LOCAL_PATH);
})();
