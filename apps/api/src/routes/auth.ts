import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '@frameflow/db';
import { signToken, requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Helper to seed/ensure default demo user exists
async function getOrCreateDefaultDemoUser() {
  let user = await prisma.user.findFirst({
    where: { email: 'photographer@frameflow.test' }
  });

  if (!user) {
    user = await prisma.user.findFirst();
  }

  if (user) return user;

  const passwordHash = await bcrypt.hash('password123', 10);
  return prisma.user.create({
    data: {
      email: 'photographer@frameflow.test',
      passwordHash,
      fullName: 'Rahul Sharma',
      studioName: 'Royal Weddings Photography',
      phone: '+91 98765 43210',
      role: 'STUDIO_OWNER'
    }
  });
}

// POST /api/auth/register - Register new photographer / studio
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, fullName, studioName, phone } = req.body;

    if (!email || !password || !fullName || !studioName) {
      res.status(400).json({ error: 'Please provide email, password, full name, and studio name.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      res.status(409).json({ error: 'An account with this email address already exists.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        fullName: fullName.trim(),
        studioName: studioName.trim(),
        phone: phone ? phone.trim() : null,
        role: 'STUDIO_OWNER'
      }
    });

    const token = signToken(user);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        studioName: user.studioName,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to create studio account.' });
  }
});

// POST /api/auth/login - Photographer sign in
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Please enter your email and password.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    // Auto-seed if logging into demo account and user doesn't exist yet
    if (!user && normalizedEmail === 'photographer@frameflow.test') {
      user = await getOrCreateDefaultDemoUser();
    }

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = signToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        studioName: user.studioName,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to authenticate user.' });
  }
});

// POST /api/auth/demo - 1-Click Fast Demo Login for instant testing
router.post('/demo', async (_req: Request, res: Response): Promise<void> => {
  try {
    const user = await getOrCreateDefaultDemoUser();
    const token = signToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        studioName: user.studioName,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Demo login error:', error);
    res.status(500).json({ error: 'Failed to log in as demo studio.' });
  }
});

// GET /api/auth/me - Current authenticated user profile & studio stats
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        _count: {
          select: {
            events: true
          }
        }
      }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Calculate total media photos and bytes
    const events = await prisma.event.findMany({
      where: { userId: user.id },
      select: {
        photoCount: true,
        totalBytes: true
      }
    });

    const totalPhotos = events.reduce((sum, e) => sum + (e.photoCount || 0), 0);
    const totalBytes = events.reduce((sum, e) => sum + Number(e.totalBytes || 0), 0);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        studioName: user.studioName,
        phone: user.phone,
        role: user.role
      },
      stats: {
        totalEvents: user._count.events,
        totalPhotos,
        storageUsedBytes: totalBytes
      }
    });
  } catch (error) {
    console.error('Fetch profile error:', error);
    res.status(500).json({ error: 'Failed to load user profile.' });
  }
});

export default router;
