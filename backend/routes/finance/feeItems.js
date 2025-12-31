import { Router } from 'express';
import authToken from '../../middleware/authToken.js';
import { all, run } from '../../db/sqlite.js';

const router = Router();

router.get('/:schoolCode', authToken, async (req, res) => {
  try {
    const rows = await all(
      `SELECT * FROM finance_fee_items WHERE school_code = ?`,
      [req.params.schoolCode]
    );
    return res.json(rows || []);
  } catch (err) {
    console.error('GET /finance/fee-items error', err);
    return res.json([]);
  }
});

router.post('/:schoolCode', authToken, async (req, res) => {
  const { name, amount } = req.body;
  await run(
    `INSERT INTO finance_fee_items (school_code, name, amount)
     VALUES (?, ?, ?)`,
    [req.params.schoolCode, name, amount]
  );
  res.status(201).json({ success: true });
});

export default router;
