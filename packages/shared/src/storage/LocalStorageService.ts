import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { MediaStorageService, PresignedUploadResult } from './MediaStorageService.js';

export interface LocalStorageOptions {
  baseDir: string;
  apiBaseUrl: string;
}

export class LocalStorageService implements MediaStorageService {
  private baseDir: string;
  private apiBaseUrl: string;

  constructor(options: LocalStorageOptions) {
    this.baseDir = path.resolve(options.baseDir);
    this.apiBaseUrl = options.apiBaseUrl.replace(/\/$/, '');
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  private resolvePath(key: string): string {
    const safeKey = key.replace(/^\/+/, '');
    const fullPath = path.join(this.baseDir, safeKey);
    const parentDir = path.dirname(fullPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    return fullPath;
  }

  async getPresignedUploadUrl(
    key: string,
    contentType: string,
    _expiresInSeconds = 3600
  ): Promise<PresignedUploadResult> {
    const uploadUrl = `${this.apiBaseUrl}/api/storage/upload?key=${encodeURIComponent(key)}`;
    return {
      uploadUrl,
      key,
      headers: {
        'Content-Type': contentType
      },
      isDirectS3: false
    };
  }

  async getSignedReadUrl(key: string, _expiresInSeconds = 3600): Promise<string> {
    return `${this.apiBaseUrl}/api/storage/files?key=${encodeURIComponent(key)}`;
  }

  async getObjectStream(key: string): Promise<Readable> {
    const fullPath = this.resolvePath(key);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Object not found in local storage: ${key}`);
    }
    return fs.createReadStream(fullPath);
  }

  async getObjectBuffer(key: string): Promise<Buffer> {
    const fullPath = this.resolvePath(key);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Object not found in local storage: ${key}`);
    }
    return fs.promises.readFile(fullPath);
  }

  async putObject(
    key: string,
    data: Buffer | Readable,
    _contentType: string
  ): Promise<void> {
    const fullPath = this.resolvePath(key);
    if (Buffer.isBuffer(data)) {
      await fs.promises.writeFile(fullPath, data);
    } else {
      const writeStream = fs.createWriteStream(fullPath);
      await new Promise<void>((resolve, reject) => {
        data.pipe(writeStream);
        writeStream.on('finish', () => resolve());
        writeStream.on('error', (err: Error) => reject(err));
      });
    }
  }

  async deleteObject(key: string): Promise<void> {
    const fullPath = this.resolvePath(key);
    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
    }
  }

  async deleteObjects(keys: string[]): Promise<void> {
    for (const key of keys) {
      await this.deleteObject(key);
    }
  }
}
