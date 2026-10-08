import { prisma } from '@frameflow/db';
import { getStorageService } from './storage.js';

let cleanupTimer: NodeJS.Timeout | null = null;

/**
 * Clean up expired demo users and all their associated events,
 * media items, selections, export jobs, and S3/R2 storage files.
 */
export async function cleanupExpiredDemoAccounts(): Promise<void> {
  try {
    const now = new Date();
    const expiredUsers = await prisma.user.findMany({
      where: {
        isDemo: true,
        expiresAt: {
          lte: now
        }
      },
      include: {
        events: {
          include: {
            mediaItems: true,
            exportJobs: true
          }
        }
      }
    });

    if (expiredUsers.length === 0) return;

    console.log(`[Cleaner] Found ${expiredUsers.length} expired demo account(s). Purging assets...`);

    const storage = getStorageService();

    for (const user of expiredUsers) {
      console.log(`[Cleaner] Purging demo user ${user.id} (${user.email})...`);

      for (const event of user.events) {
        // Collect S3/R2 storage keys to delete
        const keysToDelete: string[] = [];
        for (const item of event.mediaItems) {
          if (item.originalKey) keysToDelete.push(item.originalKey);
          if (item.previewKey) keysToDelete.push(item.previewKey);
          if (item.thumbnailKey) keysToDelete.push(item.thumbnailKey);
        }
        for (const job of event.exportJobs) {
          if (job.outputKey) keysToDelete.push(job.outputKey);
        }

        // Delete from object storage
        for (const key of keysToDelete) {
          try {
            await storage.deleteObject(key);
          } catch (err) {
            console.warn(`[Cleaner] Failed to delete key ${key} from storage:`, err);
          }
        }

        // Delete DB event record (cascades to mediaItems, selectionRounds, selections, sessions, exportJobs)
        await prisma.event.delete({
          where: { id: event.id }
        });
      }

      // Delete the user record
      await prisma.user.delete({
        where: { id: user.id }
      });

      console.log(`[Cleaner] Successfully deleted demo account ${user.id}`);
    }
  } catch (error) {
    console.error('[Cleaner] Error during demo accounts cleanup:', error);
  }
}

/**
 * Start recurring background cleaner (every 10 minutes)
 */
export function startDemoCleanupCron(intervalMs: number = 10 * 60 * 1000): void {
  if (cleanupTimer) return;

  // Run initial cleanup on startup
  cleanupExpiredDemoAccounts();

  cleanupTimer = setInterval(() => {
    cleanupExpiredDemoAccounts();
  }, intervalMs);

  console.log(`[Cleaner] Background demo cleaner started (interval: ${intervalMs / 1000}s)`);
}
