import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'node:stream';
import { MediaStorageService, PresignedUploadResult } from './MediaStorageService.js';

export interface S3StorageOptions {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  endpoint?: string; // Optional custom endpoint (MinIO, LocalStack, etc.)
  publicDomain?: string; // Optional CloudFront or custom domain
}

export class S3StorageService implements MediaStorageService {
  private s3Client: S3Client;
  private bucketName: string;
  private publicDomain?: string;

  constructor(options: S3StorageOptions) {
    this.bucketName = options.bucketName;
    this.publicDomain = options.publicDomain?.replace(/\/$/, '');

    this.s3Client = new S3Client({
      region: options.region || 'ap-south-1',
      ...(options.endpoint ? { endpoint: options.endpoint } : {}),
      credentials: {
        accessKeyId: options.accessKeyId,
        secretAccessKey: options.secretAccessKey
      }
    });
  }

  async getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresInSeconds = 3600
  ): Promise<PresignedUploadResult> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: expiresInSeconds
    });

    return {
      uploadUrl,
      key,
      headers: {
        'Content-Type': contentType
      },
      isDirectS3: true
    };
  }

  async getSignedReadUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    if (this.publicDomain) {
      return `${this.publicDomain}/${key}`;
    }

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key
    });

    return getSignedUrl(this.s3Client, command, {
      expiresIn: expiresInSeconds
    });
  }

  async getObjectStream(key: string): Promise<Readable> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key
    });

    const response = await this.s3Client.send(command);
    if (!response.Body) {
      throw new Error(`Empty body returned for S3 object: ${key}`);
    }
    return response.Body as Readable;
  }

  async getObjectBuffer(key: string): Promise<Buffer> {
    const stream = await this.getObjectStream(key);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  async deleteObject(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key
    });
    await this.s3Client.send(command);
  }

  async deleteObjects(keys: string[]): Promise<void> {
    if (keys.length === 0) return;

    const command = new DeleteObjectsCommand({
      Bucket: this.bucketName,
      Delete: {
        Objects: keys.map((Key) => ({ Key }))
      }
    });
    await this.s3Client.send(command);
  }

  async putObject(key: string, body: Buffer | Readable, contentType: string): Promise<void> {
    let uploadBody = body;
    if (Buffer.isBuffer(body)) {
      uploadBody = body;
    } else {
      const chunks: Buffer[] = [];
      for await (const chunk of body) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      uploadBody = Buffer.concat(chunks);
    }

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: uploadBody,
      ContentType: contentType
    });

    await this.s3Client.send(command);
  }
}
