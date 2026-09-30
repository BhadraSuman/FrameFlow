import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';

const router = Router();
const baseDir = process.env.LOCAL_STORAGE_DIR || path.resolve(process.cwd(), '../../.storage');

// PUT /api/storage/upload?key=...
router.put('/upload', (req, res) => {
  const key = req.query.key as string;
  if (!key) {
    res.status(400).send('Missing key parameter');
    return;
  }

  const safeKey = key.replace(/^\/+/, '');
  const fullPath = path.join(baseDir, safeKey);
  const parent = path.dirname(fullPath);

  if (!fs.existsSync(parent)) {
    fs.mkdirSync(parent, { recursive: true });
  }

  const writeStream = fs.createWriteStream(fullPath);
  req.pipe(writeStream);

  writeStream.on('finish', () => {
    res.status(200).send({ success: true, key });
  });

  writeStream.on('error', (err) => {
    console.error('Error writing local file:', err);
    res.status(500).send({ error: 'Failed to write file' });
  });
});

// GET /api/storage/files?key=...
router.get('/files', (req, res) => {
  const key = req.query.key as string;
  if (!key) {
    res.status(400).send('Missing key parameter');
    return;
  }

  const safeKey = key.replace(/^\/+/, '');
  const fullPath = path.join(baseDir, safeKey);

  if (!fs.existsSync(fullPath)) {
    res.status(404).send('File not found');
    return;
  }

  if (safeKey.endsWith('.webp')) {
    res.setHeader('Content-Type', 'image/webp');
  } else if (safeKey.endsWith('.jpg') || safeKey.endsWith('.jpeg')) {
    res.setHeader('Content-Type', 'image/jpeg');
  } else if (safeKey.endsWith('.png')) {
    res.setHeader('Content-Type', 'image/png');
  }

  if (req.query.download === 'true') {
    const filename = (req.query.filename as string) || path.basename(safeKey);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  }

  res.setHeader('Cache-Control', 'public, max-age=86400');
  fs.createReadStream(fullPath).pipe(res);
});

export default router;
