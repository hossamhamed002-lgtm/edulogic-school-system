import { Router } from 'express';
import authJwt from '../../middlewares/authJwt.js';
import { requireRole } from '../../middlewares/requireRole.js';

const router = Router();

// Ensure CORS headers for this router (defensive)
router.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// In-memory placeholder storage to avoid 404/401 while keeping developer scope enforced
const memoryStore = new Map();

// Enforce developer role for all backups endpoints
router.use(authJwt, requireRole(['DEVELOPER']));

router.get('/', (req, res) => {
  res.json({ message: 'Backups module ready. Full export will be enabled later.' });
});

router.get('/:key', (req, res) => {
  const key = req.params.key || '';
  const data = memoryStore.get(key);
  res.json(Array.isArray(data) ? data : []);
});

router.post('/:key', (req, res) => {
  const key = req.params.key || '';
  const payload = Array.isArray(req.body) ? req.body : (typeof req.body === 'object' && req.body !== null ? [req.body] : []);
  memoryStore.set(key, payload || []);
  res.json({ ok: true });
});

export default router;
