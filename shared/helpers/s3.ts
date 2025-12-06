import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import Fs from 'fs';
import { pipeline } from 'stream';
import { promisify } from 'util';

const streamPipeline = promisify(pipeline)

export default class S3 {
    private _s3: S3Client;

    constructor() {
        this._s3 = new S3Client({ region: process.env.AWS_REGION! });
    }

    async downloadFile(bucketName: string, key: string, downloadPath: string) {
        const response = await this._s3.send(
            new GetObjectCommand({
                Bucket: bucketName,
                Key: key,
            }),
        );
        if (!response.Body) throw new Error("No data returned from S3");
        await streamPipeline(response.Body as any, Fs.createWriteStream(downloadPath));
    }

    async getFileContents(bucketName: string, key: string) {
        const response = await this._s3.send(
            new GetObjectCommand({
                Bucket: bucketName,
                Key: key,
            }),
        );
        if (!response.Body) throw new Error("No data returned from S3");

        return response.Body.transformToString();
    }

    async uploadFile(fileContents: string, bucketName: string, key: string) {
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: fileContents,
        });

        await this._s3.send(command);
    }
}
