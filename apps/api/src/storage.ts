import path from 'node:path';
import {
  LocalStorageService,
  MediaStorageService,
  R2StorageService
} from '@frameflow/shared';

export function getStorageService(): MediaStorageService {
  if (
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME
  ) {
    return new R2StorageService({
      accountId: process.env.R2_ACCOUNT_ID,
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      bucketName: process.env.R2_BUCKET_NAME,
      publicDomain: process.env.R2_PUBLIC_DOMAIN
    });
  }

  const baseDir = process.env.LOCAL_STORAGE_DIR || path.resolve(process.cwd(), '../../.storage');
  const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:4000';
  return new LocalStorageService({
    baseDir,
    apiBaseUrl
  });
}
