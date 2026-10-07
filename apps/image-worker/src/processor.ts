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

    // Check if event has watermark enabled
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        user: {
          select: { studioName: true }
        }
      }
    });

    const isWatermarkEnabled = Boolean(event?.enableWatermark);
    const studioText = (event?.user?.studioName || 'PROOF ONLY').toUpperCase();

    // 5. Generate 1600px WebP preview for lightbox
    let previewPipeline = sharp(originalBuffer)
      .rotate()
      .resize({
        width: 1600,
        height: 1600,
        fit: 'inside',
        withoutEnlargement: true
      });

    if (isWatermarkEnabled) {
      // Create SVG watermark overlay matching preview dimensions or a standard overlay box
      const svgWatermark = Buffer.from(`
        <svg width="800" height="400" viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg">
          <style>
            .watermark-text {
              fill: rgba(255, 255, 255, 0.45);
              font-family: sans-serif;
              font-weight: 800;
              font-size: 38px;
              letter-spacing: 6px;
              text-anchor: middle;
            }
            .sub-text {
              fill: rgba(255, 255, 255, 0.35);
              font-family: sans-serif;
              font-weight: 600;
              font-size: 18px;
              letter-spacing: 4px;
              text-anchor: middle;
            }
          </style>
          <g transform="rotate(-30 400 200)">
            <text x="400" y="190" class="watermark-text">${studioText}</text>
            <text x="400" y="235" class="sub-text">DO NOT COPY • PROOF ONLY</text>
          </g>
        </svg>
      `);

      previewPipeline = previewPipeline.composite([
        {
          input: svgWatermark,
          gravity: 'center'
        }
      ]);
    }

    const previewBuffer = await previewPipeline
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
