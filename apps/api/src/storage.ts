import path from 'node:path';
import {
  LocalStorageService,
  MediaStorageService,
  R2StorageService,
  S3StorageService
} from '@frameflow/shared';

export function getStorageService(): MediaStorageService {
  const driver = (process.env.STORAGE_DRIVER || '').toLowerCase();

  // 1. Native AWS S3 Storage
  if (
    driver === 's3' ||
    (process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.AWS_BUCKET_NAME)
  ) {
    return new S3StorageService({
      region: process.env.AWS_REGION || 'ap-south-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      bucketName: process.env.AWS_BUCKET_NAME || '',
      endpoint: process.env.AWS_ENDPOINT,
      publicDomain: process.env.AWS_PUBLIC_DOMAIN
    });
  }

  // 2. Cloudflare R2 Storage (S3-compatible, zero egress)
  if (
    driver === 'r2' ||
    (process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME)
  ) {
    return new R2StorageService({
      accountId: process.env.R2_ACCOUNT_ID || '',
      accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
      bucketName: process.env.R2_BUCKET_NAME || '',
      publicDomain: process.env.R2_PUBLIC_DOMAIN
    });
  }

  // 3. Zero-Config Local Storage Fallback
  const baseDir = process.env.LOCAL_STORAGE_DIR || path.resolve(process.cwd(), '../../.storage');
  const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:4000';
  return new LocalStorageService({
    baseDir,
    apiBaseUrl
  });
}
