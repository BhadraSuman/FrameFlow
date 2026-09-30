import sharp from 'sharp';
import { prisma } from '@frameflow/db';
import { ProcessImageJobPayload } from '@frameflow/shared';
import { getStorageService } from './storage.js';

export async function processImage(payload: ProcessImageJobPayload): Promise<void> {
  const { mediaId, eventId, key, originalFilename } = payload;
  const storage = getStorageService();

  console.log(`[Worker] Starting image processing for Media ID: ${mediaId} (${originalFilename})`);

  try {
    // 1. Mark status as PROCESSING
    await prisma.mediaItem.update({
      where: { id: mediaId },
      data: { status: 'PROCESSING' }
    });

    // 2. Fetch original image buffer from storage
    const originalBuffer = await storage.getObjectBuffer(key);

    // 3. Extract metadata
    const metadata = await sharp(originalBuffer).metadata();
    const originalWidth = metadata.width || null;
    const originalHeight = metadata.height || null;

    // 4. Generate 400px WebP thumbnail
    const thumbnailBuffer = await sharp(originalBuffer)
      .rotate() // auto-orient from EXIF
      .resize({
        width: 400,
        height: 400,
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: 80 })
      .toBuffer();

    const thumbnailKey = `thumbnails/${eventId}/${mediaId}.webp`;
    await storage.putObject(thumbnailKey, thumbnailBuffer, 'image/webp');

    // 5. Generate 1600px WebP preview for lightbox
    const previewBuffer = await sharp(originalBuffer)
      .rotate()
      .resize({
        width: 1600,
        height: 1600,
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: 85 })
      .toBuffer();

    const previewKey = `previews/${eventId}/${mediaId}.webp`;
    await storage.putObject(previewKey, previewBuffer, 'image/webp');

    // 6. Mark status as READY and save keys & dimensions
    await prisma.mediaItem.update({
      where: { id: mediaId },
      data: {
        status: 'READY',
        thumbnailKey,
        previewKey,
        width: originalWidth,
        height: originalHeight
      }
    });

    // 7. Update event total counts
    const readyItems = await prisma.mediaItem.findMany({
      where: { eventId, status: 'READY' },
      select: { fileSizeBytes: true }
    });

    const photoCount = readyItems.length;
    const totalBytes = readyItems.reduce(
      (acc, item) => acc + BigInt(item.fileSizeBytes),
      0n
    );

    // If event has no cover image yet, set this as the cover
    const currentEvent = await prisma.event.findUnique({
      where: { id: eventId },
      select: { coverMediaId: true }
    });

    await prisma.event.update({
      where: { id: eventId },
      data: {
        photoCount,
        totalBytes,
        coverMediaId: currentEvent?.coverMediaId || mediaId
      }
    });

    console.log(
      `[Worker] Finished processing Media ID: ${mediaId}. Thumbnail: ${thumbnailKey}, Preview: ${previewKey}`
    );
  } catch (error) {
    console.error(`[Worker] Error processing Media ID: ${mediaId}:`, error);

    await prisma.mediaItem.update({
      where: { id: mediaId },
      data: { status: 'FAILED' }
    });
    throw error;
  }
}
