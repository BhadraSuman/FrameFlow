import { Queue } from 'bullmq';
import { ProcessImageJobPayload } from '@frameflow/shared';

let imageQueue: Queue | null = null;

const redisConnection = process.env.REDIS_URL
  ? { url: process.env.REDIS_URL }
  : process.env.REDIS_HOST
  ? { host: process.env.REDIS_HOST, port: parseInt(process.env.REDIS_PORT || '6379', 10) }
  : null;

if (redisConnection) {
  try {
    imageQueue = new Queue('image-processing', {
      connection: redisConnection
    });
    console.log('[API] Connected to BullMQ Redis on queue: image-processing');
  } catch (err) {
    console.warn('[API] Could not connect to Redis BullMQ. Will fallback to HTTP microservice dispatch.', err);
  }
}

export async function dispatchImageProcessingJob(payload: ProcessImageJobPayload): Promise<void> {
  if (imageQueue) {
    await imageQueue.add('process-image', payload, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    });
    console.log(`[API] Enqueued image job for media ${payload.mediaId} via BullMQ`);
    return;
  }

  // Microservice HTTP Dispatch fallback
  const workerUrl = process.env.WORKER_URL || 'http://localhost:4001';
  try {
    const res = await fetch(`${workerUrl}/process-job`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Worker returned ${res.status}: ${errText}`);
    }

    console.log(`[API] Dispatched image job for media ${payload.mediaId} to Image Worker at ${workerUrl}`);
  } catch (err) {
    console.error(`[API] Failed to dispatch job to Image Worker microservice at ${workerUrl}:`, err);
    throw err;
  }
}
