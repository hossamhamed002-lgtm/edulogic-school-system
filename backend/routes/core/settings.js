import { Router } from 'express';
import authToken from '../../middleware/authToken.js';
import { all, run } from '../../db/sqlite.js';

const router = Router();

// GET /settings/:schoolCode
router.get('/:schoolCode', authToken, async (req, res) => {
  const rows = await all(
    `SELECT key, value FROM core_settings WHERE school_code = ?`,
    [req.params.schoolCode]
  );
  res.json(rows);
});

// POST /settings/:schoolCode
router.post('/:schoolCode', authToken, async (req, res) => {
  const { key, value } = req.body;
  await run(
    `INSERT INTO core_settings (school_code, key, value)
     VALUES (?, ?, ?)`,
    [req.params.schoolCode, key, value]
  );
  res.status(201).json({ success: true });
});

export default router;
