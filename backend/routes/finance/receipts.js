import { Router } from 'express';
import authToken from '../../middleware/authToken.js';
import { all, run } from '../../db/sqlite.js';

const router = Router();

router.get('/:schoolCode', authToken, async (req, res) => {
  const rows = await all(
    `SELECT * FROM finance_receipts WHERE school_code = ? ORDER BY id DESC`,
    [req.params.schoolCode]
  );
  res.json(rows);
});

router.post('/:schoolCode', authToken, async (req, res) => {
  const { receipt_date, amount, description } = req.body;
  await run(
    `INSERT INTO finance_receipts (school_code, receipt_date, amount, description)
     VALUES (?, ?, ?, ?)`,
    [req.params.schoolCode, receipt_date, amount, description]
  );
  res.status(201).json({ success: true });
});

export default router;
