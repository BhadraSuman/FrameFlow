import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __frameflow_prisma: PrismaClient | undefined;
}

export const prisma =
  global.__frameflow_prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
  });

if (process.env.NODE_ENV !== 'production') {
  global.__frameflow_prisma = prisma;
}

export * from '@prisma/client';
