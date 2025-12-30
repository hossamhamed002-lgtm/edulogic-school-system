import { Router } from 'express';
import authJwt from '../../middlewares/authJwt.js';
import { requireRole } from '../../middlewares/requireRole.js';

const router = Router();

// Skeleton endpoint للنسخ الاحتياطية (Developer only, system scope)
router.get(
  '/',
  authJwt,
  requireRole(['DEVELOPER']),
  async (req, res) => {
    if ((req.user?.scope || '').toUpperCase() !== 'SYSTEM') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    res.json({
      message: 'Backups module ready. Full export will be enabled later.'
    });
  }
);

export default router;
