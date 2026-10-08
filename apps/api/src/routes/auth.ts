import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '@frameflow/db';
import { signToken, requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || '');

// Helper to seed/ensure default demo user exists (fallback)
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

// POST /api/auth/demo - 1-Click Isolated Demo Login with 24h auto-expiry
router.post('/demo', async (_req: Request, res: Response): Promise<void> => {
  try {
    const demoSuffix = crypto.randomBytes(3).toString('hex');
    const demoEmail = `demo_${demoSuffix}@frameflow.test`;
    const passwordHash = await bcrypt.hash(`demo_${demoSuffix}`, 10);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // Exactly 24 hours from creation

    const demoUser = await prisma.user.create({
      data: {
        email: demoEmail,
        passwordHash,
        fullName: `Guest Photographer`,
        studioName: `Demo Studio #${demoSuffix.toUpperCase()}`,
        phone: null,
        role: 'STUDIO_OWNER',
        isDemo: true,
        expiresAt
      }
    });

    const token = signToken(demoUser);

    res.json({
      token,
      user: {
        id: demoUser.id,
        email: demoUser.email,
        fullName: demoUser.fullName,
        studioName: demoUser.studioName,
        phone: demoUser.phone,
        role: demoUser.role,
        isDemo: true,
        expiresAt: demoUser.expiresAt?.toISOString()
      }
    });
  } catch (error) {
    console.error('Demo login error:', error);
    res.status(500).json({ error: 'Failed to create isolated demo studio.' });
  }
});

// POST /api/auth/google - Sign In / Register with Google OAuth (ID token or access token)
router.post('/google', async (req: Request, res: Response): Promise<void> => {
  try {
    const { credential, accessToken } = req.body;

    if (!credential && !accessToken) {
      res.status(400).json({ error: 'Missing Google authentication credential or token.' });
      return;
    }

    let email: string | undefined;
    let name: string | undefined;

    if (credential) {
      // 1. Verify Google JWT ID Token
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID || undefined
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        res.status(401).json({ error: 'Invalid Google credential token.' });
        return;
      }
      email = payload.email.toLowerCase().trim();
      name = payload.name || payload.given_name || 'Photographer';
    } else if (accessToken) {
      // 2. Fetch Google User Profile using OAuth Access Token
      const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!userinfoRes.ok) {
        res.status(401).json({ error: 'Failed to retrieve Google profile from access token.' });
        return;
      }
      const profile = (await userinfoRes.json()) as any;
      if (!profile?.email) {
        res.status(401).json({ error: 'Google account has no email address.' });
        return;
      }
      email = profile.email.toLowerCase().trim();
      name = profile.name || 'Photographer';
    }

    if (!email) {
      res.status(400).json({ error: 'No email found from Google identity.' });
      return;
    }

    // Find existing user or create a new studio account
    let user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      const generatedPassword = crypto.randomBytes(16).toString('hex');
      const passwordHash = await bcrypt.hash(generatedPassword, 10);
      const studioName = `${name}'s Photography`;

      user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          fullName: name || 'Studio Owner',
          studioName,
          role: 'STUDIO_OWNER',
          isDemo: false
        }
      });
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
        role: user.role,
        studioLogoUrl: (user as any).studioLogoUrl || null,
        brandColor: (user as any).brandColor || '#f43f5e',
        instagramHandle: (user as any).instagramHandle || null,
        websiteUrl: (user as any).websiteUrl || null,
        defaultWatermark: Boolean((user as any).defaultWatermark)
      }
    });
  } catch (error) {
    console.error('Google sign-in error:', error);
    res.status(500).json({ error: 'Google authentication failed. Please try again.' });
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
        role: user.role,
        studioLogoUrl: (user as any).studioLogoUrl || null,
        brandColor: (user as any).brandColor || '#f43f5e',
        instagramHandle: (user as any).instagramHandle || null,
        websiteUrl: (user as any).websiteUrl || null,
        defaultWatermark: Boolean((user as any).defaultWatermark),
        isDemo: Boolean((user as any).isDemo),
        expiresAt: (user as any).expiresAt ? (user as any).expiresAt.toISOString() : null
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

// PATCH /api/auth/profile - Update studio branding and settings
router.patch('/profile', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const {
      fullName,
      studioName,
      phone,
      studioLogoUrl,
      brandColor,
      instagramHandle,
      websiteUrl,
      defaultWatermark
    } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(fullName !== undefined && { fullName: fullName.trim() }),
        ...(studioName !== undefined && { studioName: studioName.trim() }),
        ...(phone !== undefined && { phone: phone ? phone.trim() : null }),
        ...(studioLogoUrl !== undefined && { studioLogoUrl: studioLogoUrl ? studioLogoUrl.trim() : null }),
        ...(brandColor !== undefined && { brandColor: brandColor.trim() }),
        ...(instagramHandle !== undefined && { instagramHandle: instagramHandle ? instagramHandle.trim() : null }),
        ...(websiteUrl !== undefined && { websiteUrl: websiteUrl ? websiteUrl.trim() : null }),
        ...(defaultWatermark !== undefined && { defaultWatermark: Boolean(defaultWatermark) })
      }
    });

    res.json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        studioName: updatedUser.studioName,
        phone: updatedUser.phone,
        role: updatedUser.role,
        studioLogoUrl: (updatedUser as any).studioLogoUrl || null,
        brandColor: (updatedUser as any).brandColor || '#f43f5e',
        instagramHandle: (updatedUser as any).instagramHandle || null,
        websiteUrl: (updatedUser as any).websiteUrl || null,
        defaultWatermark: Boolean((updatedUser as any).defaultWatermark)
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update studio profile.' });
  }
});

export default router;
