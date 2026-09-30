import { Readable } from 'node:stream';

export interface PresignedUploadResult {
  uploadUrl: string;
  key: string;
  headers?: Record<string, string>;
  isDirectS3: boolean;
}

export interface MediaStorageService {
  /**
   * Generates a presigned upload URL directly to storage.
   * If in local development without S3/R2 credentials, this returns a local API endpoint URL.
   */
  getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresInSeconds?: number
  ): Promise<PresignedUploadResult>;

  /**
   * Generates a signed read URL for a media item.
   */
  getSignedReadUrl(key: string, expiresInSeconds?: number): Promise<string>;

  /**
   * Returns a readable stream of the object from storage.
   */
  getObjectStream(key: string): Promise<Readable>;

  /**
   * Reads the entire object into a Buffer.
   */
  getObjectBuffer(key: string): Promise<Buffer>;

  /**
   * Puts an object directly into storage (used by the image processing worker for thumbnails and previews).
   */
  putObject(
    key: string,
    data: Buffer | Readable,
    contentType: string
  ): Promise<void>;

  /**
   * Deletes an object from storage.
   */
  deleteObject(key: string): Promise<void>;

  /**
   * Deletes multiple objects from storage.
   */
  deleteObjects(keys: string[]): Promise<void>;
}
