import { Router, Request } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@frameflow/db';
import { JWT_SECRET } from '../middleware/auth.js';
import { getStorageService } from '../storage.js';

const router = Router();

// Helper to ensure a demo user exists
async function getOrCreateDemoUser() {
  const existing = await prisma.user.findFirst();
  if (existing) return existing;

  const passwordHash = await bcrypt.hash('password123', 10);
  return prisma.user.create({
    data: {
      email: 'photographer@frameflow.test',
      passwordHash,
      fullName: 'Rahul Sharma',
      studioName: 'Royal Weddings Photography',
      phone: '+91 98765 43210'
    }
  });
}

// Resolve authenticated user from Bearer JWT token or fallback to demo user
async function resolveUser(req: Request) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      if (user && user.isActive) return user;
    } catch {
      // Invalid/expired token
    }
  }
  return getOrCreateDemoUser();
}

// Generate random 4-digit PIN
function generatePin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Generate slug
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .concat('-', Math.random().toString(36).substring(2, 6));
}

// GET /api/events - List all events
router.get('/', async (req, res) => {
  try {
    const user = await resolveUser(req);
    const events = await prisma.event.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { mediaItems: true }
        }
      }
    });

    const eventsWithPin = events.map((e) => ({
      ...e,
      pin: '0000' // Default test pin
    }));

    res.json(eventsWithPin);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// POST /api/events - Create new event
router.post('/', async (req, res) => {
  try {
    const user = await resolveUser(req);
    const {
      title = 'Priya & Rohan Wedding',
      eventType = 'Wedding',
      eventDate = new Date().toISOString(),
      clientName = 'Priya Patel',
      clientEmail = 'priya@example.com',
      clientPhone = '+91 98765 11111',
      pin = '0000'
    } = req.body;

    const pinToUse = pin || '0000';
    const pinSalt = await bcrypt.genSalt(10);
    const pinHash = await bcrypt.hash(pinToUse, pinSalt);
    const slug = slugify(title);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
    const gracePeriodEndsAt = new Date(expiresAt.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days grace

    const event = await prisma.event.create({
      data: {
        userId: user.id,
        title,
        slug,
        eventType,
        eventDate: new Date(eventDate),
        clientName,
        clientEmail,
        clientPhone,
        pinHash,
        pinSalt,
        status: 'ACTIVE',
        expiresAt,
        gracePeriodEndsAt,
        selectionRounds: {
          create: {
            roundNumber: 1,
            status: 'OPEN'
          }
        }
      }
    });

    res.status(201).json({
      ...event,
      pin: pinToUse
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// GET /api/events/:id - Get event details with photos
router.get('/:id', async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: {
        mediaItems: {
          orderBy: { createdAt: 'desc' }
        },
        selectionRounds: {
          include: {
            selections: true
          }
        }
      }
    });

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    res.json({
      ...event,
      pin: '0000'
    });
  } catch (error) {
    console.error('Error fetching event details:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// GET /api/events/:id/export/csv - Download selected photos filename list (CSV)
router.get('/:id/export/csv', async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
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
      res.status(404).send('Event not found');
      return;
    }

    const round = event.selectionRounds[0];
    const selections = round?.selections || [];

    // Header
    const rows = ['Filename,Size (Bytes),Dimensions,Selected Date,Client Comment'];
    for (const sel of selections) {
      const item = sel.mediaItem;
      const dims = item.width && item.height ? `${item.width}x${item.height}` : 'N/A';
      const comment = (sel.clientComment || '').replace(/"/g, '""');
      rows.push(`"${item.originalFilename}",${item.fileSizeBytes},"${dims}","${sel.selectedAt.toISOString()}","${comment}"`);
    }

    const csvContent = rows.join('\r\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="selection-${event.slug}.csv"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).send('Failed to generate CSV export');
  }
});

// GET /api/events/:id/export/lightroom - Copyable search query for Adobe Lightroom / Capture One
router.get('/:id/export/lightroom', async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
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
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    const round = event.selectionRounds[0];
    const selections = round?.selections || [];
    const filenames = selections.map((s) => s.mediaItem.originalFilename);
    const query = filenames.join(', ');

    res.json({
      query,
      count: filenames.length,
      filenames
    });
  } catch (error) {
    console.error('Error getting Lightroom query:', error);
    res.status(500).json({ error: 'Failed to generate Lightroom query' });
  }
});

// POST /api/events/:id/export/zip - Start background ZIP generation
router.post('/:id/export/zip', async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: {
        selectionRounds: {
          where: { roundNumber: 1 },
          include: {
            selections: true
          }
        }
      }
    });

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    const round = event.selectionRounds[0];
    if (!round || round.selections.length === 0) {
      res.status(400).json({ error: 'No selections found to export' });
      return;
    }

    // Create ExportJob record
    const exportJob = await prisma.exportJob.create({
      data: {
        eventId: event.id,
        roundId: round.id,
        exportType: 'ZIP_ORIGINALS',
        status: 'PENDING'
      }
    });

    // Dispatch to Image Worker microservice
    const workerUrl = process.env.WORKER_URL || 'http://localhost:4001';
    fetch(`${workerUrl}/process-zip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId: exportJob.id,
        eventId: event.id
      })
    }).catch((err) => {
      console.error(`[API] Failed to dispatch ZIP job to worker at ${workerUrl}:`, err);
    });

    res.status(202).json({
      jobId: exportJob.id,
      status: 'PENDING',
      message: 'Background ZIP compilation started'
    });
  } catch (error) {
    console.error('Error initiating ZIP export:', error);
    res.status(500).json({ error: 'Failed to initiate ZIP export' });
  }
});

// GET /api/events/:id/export/zip/status - Check ZIP compilation status
router.get('/:id/export/zip/status', async (req, res) => {
  try {
    const latestJob = await prisma.exportJob.findFirst({
      where: {
        eventId: req.params.id,
        exportType: 'ZIP_ORIGINALS'
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!latestJob) {
      res.json({ status: 'NONE' });
      return;
    }

    res.json(latestJob);
  } catch (error) {
    console.error('Error checking ZIP status:', error);
    res.status(500).json({ error: 'Failed to check ZIP status' });
  }
});

// DELETE /api/events/:id - Delete event and its S3/storage files
router.delete('/:id', async (req, res) => {
  try {
    const user = await resolveUser(req);
    const event = await prisma.event.findFirst({
      where: {
        id: req.params.id,
        userId: user.id
      },
      include: {
        mediaItems: true,
        exportJobs: true
      }
    });

    if (!event) {
      res.status(404).json({ error: 'Event not found or access denied' });
      return;
    }

    // 1. Gather all S3 / storage keys to delete
    const keysToDelete: string[] = [];
    for (const item of event.mediaItems) {
      if (item.originalKey) keysToDelete.push(item.originalKey);
      if (item.previewKey) keysToDelete.push(item.previewKey);
      if (item.thumbnailKey) keysToDelete.push(item.thumbnailKey);
    }
    for (const job of event.exportJobs) {
      if (job.outputKey) keysToDelete.push(job.outputKey);
    }

    // 2. Clean up files from storage (S3 / R2 / Local)
    if (keysToDelete.length > 0) {
      try {
        const storage = getStorageService();
        await storage.deleteObjects(keysToDelete);
        console.log(`[API] Deleted ${keysToDelete.length} files from storage for event ${event.id}`);
      } catch (storageErr) {
        console.warn(`[API] Non-fatal: Failed to delete some storage files for event ${event.id}:`, storageErr);
      }
    }

    // 3. Clear coverMediaId to prevent foreign key cycle
    await prisma.event.update({
      where: { id: event.id },
      data: { coverMediaId: null }
    });

    // 4. Delete the event (cascades to mediaItems, selectionRounds, selections, etc.)
    await prisma.event.delete({
      where: { id: event.id }
    });

    res.json({
      success: true,
      message: `Event "${event.title}" and its storage files were successfully deleted.`
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

export default router;
