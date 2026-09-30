import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { prisma } from '@frameflow/db';
import { getStorageService } from './storage.js';

const require = createRequire(import.meta.url);
const archiver = require('archiver');

export interface ProcessZipJobPayload {
  jobId: string;
  eventId: string;
}

export async function processZipExport(payload: ProcessZipJobPayload): Promise<void> {
  const { jobId, eventId } = payload;
  const storage = getStorageService();

  console.log(`[Worker] Starting background ZIP export for Job ID: ${jobId}, Event ID: ${eventId}`);

  try {
    // 1. Mark status as PROCESSING
    await prisma.exportJob.update({
      where: { id: jobId },
      data: { status: 'PROCESSING' }
    });

    // 2. Fetch event and selections
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        selectionRounds: {
          where: { roundNumber: 1 },
          include: {
            selections: {
              include: { mediaItem: true }
            }
          }
        }
      }
    });

    if (!event) {
      throw new Error(`Event not found: ${eventId}`);
    }

    const round = event.selectionRounds[0];
    const selections = round?.selections || [];

    if (selections.length === 0) {
      throw new Error('No photos have been selected in this round');
    }

    // 3. Create a temporary file on disk for streaming ZIP compilation
    const tmpDir = os.tmpdir();
    const tmpZipPath = path.join(tmpDir, `frameflow-export-${jobId}.zip`);
    const outputStream = fs.createWriteStream(tmpZipPath);

    const archive = archiver.ZipArchive
      ? new archiver.ZipArchive({ zlib: { level: 5 } })
      : (typeof archiver === 'function' ? archiver('zip', { zlib: { level: 5 } }) : new (archiver as any).default.ZipArchive({ zlib: { level: 5 } }));

    const archiveFinished = new Promise<void>((resolve, reject) => {
      outputStream.on('close', () => resolve());
      outputStream.on('error', (err: Error) => reject(err));
      archive.on('error', (err: Error) => reject(err));
    });

    archive.pipe(outputStream);

    // 4. Add each selected original photo
    for (const sel of selections) {
      const item = sel.mediaItem;
      try {
        const fileStream = await storage.getObjectStream(item.originalKey);
        archive.append(fileStream, { name: item.originalFilename });
      } catch (err) {
        console.warn(`[Worker] Could not stream photo ${item.originalKey}, skipping in ZIP:`, err);
      }
    }

    // 5. Add a human-readable selection summary text file
    const summaryLines = [
      `FrameFlow Event Photo Selection Summary`,
      `=======================================`,
      `Event Title: ${event.title}`,
      `Client Name: ${event.clientName} (${event.clientEmail})`,
      `Event Date: ${new Date(event.eventDate).toLocaleDateString()}`,
      `Total Photos Selected: ${selections.length}`,
      `Export Generated: ${new Date().toISOString()}`,
      ``,
      `Client Remarks:`,
      `"${round?.clientNotes || 'None'}"`,
      ``,
      `Selected Filenames & Comments:`,
      `-----------------------------`
    ];

    selections.forEach((s, idx) => {
      const comment = s.clientComment ? ` [Note: ${s.clientComment}]` : '';
      summaryLines.push(`${idx + 1}. ${s.mediaItem.originalFilename}${comment}`);
    });

    archive.append(summaryLines.join('\r\n'), { name: 'SELECTION_SUMMARY.txt' });

    // 6. Finalize archive
    await archive.finalize();
    await archiveFinished;

    const zipStats = fs.statSync(tmpZipPath);
    console.log(`[Worker] Compiled ZIP on disk: ${zipStats.size} bytes`);

    // 7. Upload compiled ZIP to storage under /exports/
    const outputKey = `exports/${eventId}/selection-${event.slug}-${jobId.substring(0, 6)}.zip`;
    const zipReadStream = fs.createReadStream(tmpZipPath);
    await storage.putObject(outputKey, zipReadStream, 'application/zip');

    // 8. Generate signed download URL (valid for 24 hours)
    const downloadUrl = await storage.getSignedReadUrl(outputKey, 86400);
    const expiresAt = new Date(Date.now() + 86400 * 1000);

    // 9. Update DB record
    await prisma.exportJob.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        outputKey,
        fileSizeBytes: BigInt(zipStats.size),
        downloadUrl,
        expiresAt,
        completedAt: new Date()
      }
    });

    // Cleanup temp file
    if (fs.existsSync(tmpZipPath)) {
      fs.unlinkSync(tmpZipPath);
    }

    console.log(`[Worker] Successfully completed ZIP export for Job ID: ${jobId}. Download URL: ${downloadUrl}`);
  } catch (error: any) {
    console.error(`[Worker] Failed ZIP export for Job ID: ${jobId}:`, error);
    await prisma.exportJob.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        errorMessage: error.message || 'ZIP export failed'
      }
    });
    throw error;
  }
}
