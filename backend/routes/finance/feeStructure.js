import { Router } from 'express';
import authToken from '../../middleware/authToken.js';
import { all, run } from '../../db/sqlite.js';

const router = Router();

router.get('/:schoolCode', authToken, async (req, res) => {
  const rows = await all(
    `SELECT * FROM finance_fee_structure WHERE school_code = ?`,
    [req.params.schoolCode]
  );
  res.json(rows);
});

router.post('/:schoolCode', authToken, async (req, res) => {
  const { stage_id, grade_id, total_amount } = req.body;
  await run(
    `INSERT INTO finance_fee_structure (school_code, stage_id, grade_id, total_amount)
     VALUES (?, ?, ?, ?)`,
    [req.params.schoolCode, stage_id || null, grade_id || null, total_amount || 0]
  );
  res.status(201).json({ success: true });
});

export default router;
