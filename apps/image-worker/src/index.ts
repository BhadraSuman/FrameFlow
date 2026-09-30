import express from 'express';
import dotenv from 'dotenv';
import { Worker } from 'bullmq';
import { ProcessImageJobPayload } from '@frameflow/shared';
import { processImage } from './processor.js';

dotenv.config();

// Enable BigInt JSON serialization
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

const app = express();
const PORT = process.env.WORKER_PORT ? parseInt(process.env.WORKER_PORT, 10) : 4001;

app.use(express.json());

// Healthcheck endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'image-worker',
    timestamp: new Date().toISOString()
  });
});

// Direct job execution endpoint (Microservice REST trigger)
app.post('/process-job', async (req, res) => {
  const payload = req.body as ProcessImageJobPayload;

  if (!payload || !payload.mediaId || !payload.key) {
    res.status(400).json({ error: 'Missing required payload fields' });
    return;
  }

  // Acknowledge immediately and run asynchronously
  res.status(202).json({
    message: 'Job accepted for processing',
    mediaId: payload.mediaId
  });

  // Execute processing asynchronously in worker background
  processImage(payload).catch((err) => {
    console.error(`[Worker] Async job failed for media ${payload.mediaId}:`, err);
  });
});

// BullMQ Worker (if REDIS_URL is provided)
let bullWorker: Worker | null = null;
if (process.env.REDIS_URL) {
  try {
    bullWorker = new Worker(
      'image-processing',
      async (job) => {
        console.log(`[Worker] Received BullMQ job: ${job.id}`);
        await processImage(job.data as ProcessImageJobPayload);
      },
      {
        connection: {
          url: process.env.REDIS_URL
        },
        concurrency: 4
      }
    );
    console.log('[Worker] Connected to Redis BullMQ on queue: image-processing');
  } catch (err) {
    console.warn('[Worker] Failed to connect to Redis BullMQ. Relying on HTTP queue.', err);
  }
}

app.listen(PORT, () => {
  console.log(`🚀 [ImageWorker] Microservice listening on http://localhost:${PORT}`);
  console.log(`⚡ Concurrency ready for Sharp WebP thumbnails (400px) & previews (1600px)`);
});
