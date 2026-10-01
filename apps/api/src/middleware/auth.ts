import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '@frameflow/db';

export const JWT_SECRET = process.env.JWT_SECRET || 'frameflow-secret-super-key-2026';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  studioName: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Fallback for seamless local test compatibility if header absent
      if (process.env.ALLOW_ANON_DEMO === 'true') {
        const demoUser = await prisma.user.findFirst();
        if (demoUser) {
          req.user = {
            id: demoUser.id,
            email: demoUser.email,
            fullName: demoUser.fullName,
            studioName: demoUser.studioName,
            role: demoUser.role
          };
          next();
          return;
        }
      }

      res.status(401).json({ error: 'Authentication required. Please sign in.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || !user.isActive) {
      res.status(401).json({ error: 'User account not found or disabled.' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      studioName: user.studioName,
      role: user.role
    };

    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired session token. Please sign in again.' });
  }
}

// Optional helper to generate signed token
export function signToken(user: { id: string; email: string }): string {
  return jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: '7d'
  });
}
