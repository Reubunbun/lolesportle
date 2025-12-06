import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    HeadObjectCommand,
} from '@aws-sdk/client-s3';
import Fs from 'fs';
import { pipeline } from 'stream';
import { promisify } from 'util';

const streamPipeline = promisify(pipeline)

export default class S3 {
    private _s3: S3Client;

    constructor() {
        this._s3 = new S3Client({ region: process.env.AWS_REGION! });
    }

    async fileExists(key: string) {
        try {
            await this._s3.send(new HeadObjectCommand({
                Bucket: process.env.STORAGE_BUCKET,
                Key: key,
            }));
            return true;
        } catch (err: any) {
            if (err.name === 'NotFound') return false;
            throw err;
        }
    }

    async downloadFile(key: string, downloadPath: string) {
        const response = await this._s3.send(
            new GetObjectCommand({
                Bucket: process.env.STORAGE_BUCKET,
                Key: key,
            }),
        );
        if (!response.Body) throw new Error("No data returned from S3");
        await streamPipeline(response.Body as any, Fs.createWriteStream(downloadPath));
    }

    async getFileContents(key: string) {
        const response = await this._s3.send(
            new GetObjectCommand({
                Bucket: process.env.STORAGE_BUCKET,
                Key: key,
            }),
        );
        if (!response.Body) throw new Error("No data returned from S3");

        return response.Body.transformToString();
    }

    async uploadFile(key: string, fileContents: string | Buffer) {
        const command = new PutObjectCommand({
            Bucket: process.env.STORAGE_BUCKET,
            Key: key,
            Body: fileContents,
        });

        await this._s3.send(command);
    }
}
