import { Router } from 'express';
import authJwt from '../../middlewares/authJwt.js';
import requireRole from '../../middlewares/requireRole.js';
import { all, run } from '../../db/sqlite.js';

const router = Router();

router.get('/:schoolCode', authJwt, requireRole(['ADMIN', 'ACCOUNTANT']), async (req, res) => {
  try {
    const rows = await all(
      `SELECT * FROM finance_accounts WHERE school_code = ?`,
      [req.params.schoolCode]
    );
    return res.json(rows || []);
  } catch (err) {
    console.error('GET /finance/accounts error', err);
    return res.json([]);
  }
});

router.post('/:schoolCode', authJwt, requireRole(['ADMIN', 'ACCOUNTANT']), async (req, res) => {
  const { code, name, type, parent_id } = req.body;
  await run(
    `INSERT INTO finance_accounts (school_code, code, name, type, parent_id)
     VALUES (?, ?, ?, ?, ?)`,
    [req.params.schoolCode, code, name, type, parent_id || null]
  );
  res.status(201).json({ success: true });
});

export default router;
