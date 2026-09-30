import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import eventsRouter from './routes/events.js';
import uploadsRouter from './routes/uploads.js';
import galleriesRouter from './routes/galleries.js';
import storageRouter from './routes/storage.js';

dotenv.config();

// Enable BigInt JSON serialization
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Healthcheck
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'frameflow-api',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/events', eventsRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/galleries', galleriesRouter);
app.use('/api/storage', storageRouter);

app.listen(PORT, () => {
  console.log(`🚀 [API] FrameFlow REST API listening on http://localhost:${PORT}`);
  console.log(`📸 Ready for direct uploads & gallery proofing`);
});
