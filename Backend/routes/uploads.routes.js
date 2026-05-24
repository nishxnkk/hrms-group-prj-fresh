import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const router = express.Router();

const UPLOAD_DIR = path.join(process.cwd(), 'assets', 'uploads');
const DELETED_DIR = path.join(UPLOAD_DIR, 'deleted');

// ensure directories exist
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
fs.mkdirSync(DELETED_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ts = Date.now();
    const safe = file.originalname.replace(/[^a-zA-Z0-9.\-\_]/g, '_');
    cb(null, `${ts}_${safe}`);
  }
});

const upload = multer({ storage });

// Upload a single file
router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.status(201).json({ filename: req.file.filename, original: req.file.originalname, size: req.file.size });
});

// List all uploads
router.get('/', (req, res) => {
  const files = fs.readdirSync(UPLOAD_DIR).filter(f => f !== 'deleted');
  const meta = files.map(f => {
    const stats = fs.statSync(path.join(UPLOAD_DIR, f));
    return { filename: f, size: stats.size, created_at: stats.ctime };
  });
  res.json(meta);
});

// List recently deleted
router.get('/deleted', (req, res) => {
  const files = fs.readdirSync(DELETED_DIR);
  const meta = files.map(f => {
    const stats = fs.statSync(path.join(DELETED_DIR, f));
    return { filename: f, size: stats.size, deleted_at: stats.ctime };
  });
  res.json(meta);
});

// Delete (move to recently deleted)
router.delete('/:filename', (req, res) => {
  const { filename } = req.params;
  const src = path.join(UPLOAD_DIR, filename);
  const dest = path.join(DELETED_DIR, filename);
  if (!fs.existsSync(src)) return res.status(404).json({ error: 'Not found' });
  fs.renameSync(src, dest);
  res.json({ success: true });
});

// Restore from deleted (move back)
router.post('/restore/:filename', (req, res) => {
  const { filename } = req.params;
  const src = path.join(DELETED_DIR, filename);
  const dest = path.join(UPLOAD_DIR, filename);
  if (!fs.existsSync(src)) return res.status(404).json({ error: 'Not found' });
  fs.renameSync(src, dest);
  res.json({ success: true });
});

export default router;
