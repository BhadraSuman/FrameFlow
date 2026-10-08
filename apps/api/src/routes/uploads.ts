import { Router } from 'express';
import { prisma } from '@frameflow/db';
import { getStorageService } from '../storage.js';
import { dispatchImageProcessingJob } from '../queue.js';
import { InitiateUploadRequest, CompleteUploadRequest } from '@frameflow/shared';

const router = Router();

// POST /api/uploads/presign - Generate presigned direct upload URL
router.post('/presign', async (req, res) => {
  try {
    const { eventId, filename, fileSizeBytes, mimeType } = req.body as InitiateUploadRequest;

    if (!eventId || !filename || !fileSizeBytes || !mimeType) {
      res.status(400).json({ error: 'Missing required upload parameters' });
      return;
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        user: {
          select: { id: true }
        }
      }
    });

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    // Check 5 GB Studio Free Tier storage limit
    const FREE_TIER_MAX_BYTES = 5n * 1024n * 1024n * 1024n; // 5 GB
    const userEvents = await prisma.event.findMany({
      where: { userId: event.userId },
      select: { totalBytes: true }
    });
    const currentStorageBytes = userEvents.reduce((acc, ev) => acc + BigInt(ev.totalBytes || 0), 0n);

    if (currentStorageBytes + BigInt(fileSizeBytes) > FREE_TIER_MAX_BYTES) {
      res.status(400).json({
        error: 'Studio storage quota exceeded (5 GB limit). Delete past events to free up space or upgrade your plan.'
      });
      return;
    }

    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storage = getStorageService();

    // Create DB entry first with status PENDING_UPLOAD
    const mediaItem = await prisma.mediaItem.create({
      data: {
        eventId,
        originalFilename: filename,
        originalKey: '', // populated below
        mimeType,
        fileSizeBytes: BigInt(fileSizeBytes),
        status: 'PENDING_UPLOAD'
      }
    });

    const key = `originals/${eventId}/${mediaItem.id}-${safeFilename}`;

    // Update with key
    await prisma.mediaItem.update({
      where: { id: mediaItem.id },
      data: { originalKey: key }
    });

    // Generate presigned upload URL
    const presigned = await storage.getPresignedUploadUrl(key, mimeType, 3600);

    res.json({
      mediaId: mediaItem.id,
      key,
      uploadUrl: presigned.uploadUrl,
      headers: presigned.headers,
      isDirectS3: presigned.isDirectS3
    });
  } catch (error) {
    console.error('Error generating presigned upload URL:', error);
    res.status(500).json({ error: 'Failed to initiate upload' });
  }
});

// POST /api/uploads/complete - Finalize upload and trigger Image Worker
router.post('/complete', async (req, res) => {
  try {
    const { mediaId, eventId, key } = req.body as CompleteUploadRequest;

    if (!mediaId || !key) {
      res.status(400).json({ error: 'Missing mediaId or key' });
      return;
    }

    const mediaItem = await prisma.mediaItem.findUnique({
      where: { id: mediaId }
    });

    if (!mediaItem) {
      res.status(404).json({ error: 'MediaItem not found' });
      return;
    }

    // Mark as uploaded
    await prisma.mediaItem.update({
      where: { id: mediaId },
      data: { status: 'UPLOADED' }
    });

    // Dispatch to Image Worker microservice
    await dispatchImageProcessingJob({
      mediaId,
      eventId: eventId || mediaItem.eventId,
      key,
      originalFilename: mediaItem.originalFilename
    });

    res.json({
      success: true,
      message: 'Upload completed and queued for image processing',
      mediaId
    });
  } catch (error) {
    console.error('Error completing upload:', error);
    res.status(500).json({ error: 'Failed to complete upload' });
  }
});

export default router;
