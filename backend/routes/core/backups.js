import { Router } from 'express';
import authJwt from '../../middlewares/authJwt.js';
import { requireRole } from '../../middlewares/requireRole.js';

const router = Router();

// In-memory placeholder storage to avoid 404/401 while keeping developer scope enforced
const memoryStore = new Map();

// Enforce developer + system scope for all backups endpoints
router.use(authJwt, requireRole(['DEVELOPER']), (req, res, next) => {
  if ((req.user?.scope || '').toUpperCase() !== 'SYSTEM') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
});

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
