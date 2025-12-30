import { Router } from 'express';
import authToken from '../../middleware/authToken.js';

const router = Router();

// Skeleton endpoint للنسخ الاحتياطية
router.get('/:schoolCode', authToken, async (_req, res) => {
  res.json({
    message: 'Backups module ready. Full export will be enabled later.'
  });
});

export default router;
