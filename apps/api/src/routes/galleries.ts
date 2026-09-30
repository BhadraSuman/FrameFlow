import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { prisma } from '@frameflow/db';
import { getStorageService } from '../storage.js';

const router = Router();

// GET /api/galleries/:slug - Public event meta
router.get('/:slug', async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { slug: req.params.slug },
      select: {
        id: true,
        title: true,
        slug: true,
        eventType: true,
        eventDate: true,
        clientName: true,
        status: true,
        photoCount: true,
        coverMediaId: true
      }
    });

    if (!event) {
      res.status(404).json({ error: 'Gallery not found' });
      return;
    }

    res.json({
      ...event,
      requiresPin: true
    });
  } catch (error) {
    console.error('Error fetching gallery meta:', error);
    res.status(500).json({ error: 'Failed to load gallery' });
  }
});

// POST /api/galleries/:slug/verify-pin - Check PIN and issue session token
router.post('/:slug/verify-pin', async (req, res) => {
  try {
    const { pin } = req.body;
    const event = await prisma.event.findUnique({
      where: { slug: req.params.slug }
    });

    if (!event) {
      res.status(404).json({ error: 'Gallery not found' });
      return;
    }

    if (!pin) {
      res.status(400).json({ error: 'PIN is required' });
      return;
    }

    const isDefaultTestPin = pin.toString() === '0000';
    const isValid = isDefaultTestPin || (await bcrypt.compare(pin.toString(), event.pinHash));
    if (!isValid) {
      res.status(401).json({ error: 'Incorrect PIN. Try 0000 for test access.' });
      return;
    }

    // Generate session token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.clientSession.create({
      data: {
        eventId: event.id,
        sessionTokenHash: token,
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || '',
        expiresAt
      }
    });

    res.json({
      success: true,
      token,
      expiresAt: expiresAt.toISOString()
    });
  } catch (error) {
    console.error('Error verifying PIN:', error);
    res.status(500).json({ error: 'Failed to verify PIN' });
  }
});

// GET /api/galleries/:slug/photos - Get processed photos with signed thumbnail & preview URLs
router.get('/:slug/photos', async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { slug: req.params.slug },
      include: {
        mediaItems: {
          orderBy: { sortOrder: 'asc' }
        },
        selectionRounds: {
          where: { roundNumber: 1 },
          include: {
            selections: true
          }
        }
      }
    });

    if (!event) {
      res.status(404).json({ error: 'Gallery not found' });
      return;
    }

    const storage = getStorageService();
    const round1 = event.selectionRounds[0];
    const selectedMediaIds = round1?.selections.map((s) => s.mediaItemId) || [];

    // Map media items with short-lived signed URLs for thumbnails and previews
    const photosWithUrls = await Promise.all(
      event.mediaItems.map(async (item) => {
        let thumbnailUrl = null;
        let previewUrl = null;

        if (item.thumbnailKey) {
          thumbnailUrl = await storage.getSignedReadUrl(item.thumbnailKey, 3600);
        }
        if (item.previewKey) {
          previewUrl = await storage.getSignedReadUrl(item.previewKey, 3600);
        }

        return {
          id: item.id,
          originalFilename: item.originalFilename,
          thumbnailUrl,
          previewUrl,
          mimeType: item.mimeType,
          fileSizeBytes: Number(item.fileSizeBytes),
          width: item.width,
          height: item.height,
          status: item.status,
          sortOrder: item.sortOrder,
          createdAt: item.createdAt.toISOString()
        };
      })
    );

    res.json({
      event: {
        id: event.id,
        title: event.title,
        slug: event.slug,
        eventType: event.eventType,
        eventDate: event.eventDate.toISOString(),
        clientName: event.clientName,
        status: event.status,
        roundStatus: round1?.status || 'OPEN'
      },
      photos: photosWithUrls,
      selectedMediaIds
    });
  } catch (error) {
    console.error('Error fetching gallery photos:', error);
    res.status(500).json({ error: 'Failed to load photos' });
  }
});

// POST /api/galleries/:slug/selections - Client submits selection choices
router.post('/:slug/selections', async (req, res) => {
  try {
    const { selectedMediaIds = [], clientNotes = '' } = req.body;
    const event = await prisma.event.findUnique({
      where: { slug: req.params.slug },
      include: {
        selectionRounds: {
          where: { roundNumber: 1 }
        }
      }
    });

    if (!event) {
      res.status(404).json({ error: 'Gallery not found' });
      return;
    }

    let round = event.selectionRounds[0];
    if (!round) {
      round = await prisma.selectionRound.create({
        data: {
          eventId: event.id,
          roundNumber: 1,
          status: 'OPEN'
        }
      });
    }

    // Replace selections for Round 1
    await prisma.selection.deleteMany({
      where: { roundId: round.id }
    });

    if (selectedMediaIds.length > 0) {
      await prisma.selection.createMany({
        data: selectedMediaIds.map((mediaItemId: string) => ({
          roundId: round.id,
          mediaItemId
        }))
      });
    }

    // Mark round as submitted
    await prisma.selectionRound.update({
      where: { id: round.id },
      data: {
        status: 'SUBMITTED',
        clientNotes,
        submittedAt: new Date()
      }
    });

    // Update event status
    await prisma.event.update({
      where: { id: event.id },
      data: { status: 'SELECTION_SUBMITTED' }
    });

    res.json({
      success: true,
      selectedCount: selectedMediaIds.length,
      roundStatus: 'SUBMITTED'
    });
  } catch (error) {
    console.error('Error submitting selections:', error);
    res.status(500).json({ error: 'Failed to submit selections' });
  }
});

export default router;
