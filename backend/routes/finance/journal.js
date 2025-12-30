import { Router } from 'express';
import authToken from '../../middleware/authToken.js';
import { all, run } from '../../db/sqlite.js';

const router = Router();

router.get('/:schoolCode', authToken, async (req, res) => {
  const rows = await all(
    `SELECT * FROM finance_journal WHERE school_code = ? ORDER BY id DESC`,
    [req.params.schoolCode]
  );
  res.json(rows);
});

router.post('/:schoolCode', authToken, async (req, res) => {
  const { entry_date, description } = req.body;
  await run(
    `INSERT INTO finance_journal (school_code, entry_date, description)
     VALUES (?, ?, ?)`,
    [req.params.schoolCode, entry_date, description]
  );
  res.status(201).json({ success: true });
});

export default router;
