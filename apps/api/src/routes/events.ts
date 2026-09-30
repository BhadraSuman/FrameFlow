import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '@frameflow/db';

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
router.get('/', async (_req, res) => {
  try {
    const user = await getOrCreateDemoUser();
    const events = await prisma.event.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { mediaItems: true }
        }
      }
    });

    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// POST /api/events - Create new event
router.post('/', async (req, res) => {
  try {
    const user = await getOrCreateDemoUser();
    const {
      title = 'Priya & Rohan Wedding',
      eventType = 'Wedding',
      eventDate = new Date().toISOString(),
      clientName = 'Priya Patel',
      clientEmail = 'priya@example.com',
      clientPhone = '+91 98765 11111'
    } = req.body;

    const pin = generatePin();
    const pinSalt = await bcrypt.genSalt(10);
    const pinHash = await bcrypt.hash(pin, pinSalt);
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
      pin // Raw PIN returned only upon creation so agency can share it
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

    res.json(event);
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

export default router;
