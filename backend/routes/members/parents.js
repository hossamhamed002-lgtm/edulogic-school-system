import { Router } from 'express';
import { all, run } from '../../db/sqlite.js';
import authToken from '../../middleware/authToken.js';

const auth = authToken;
const router = Router();

// جلب أولياء الأمور
router.get('/:schoolCode', auth, async (req, res) => {
  const { schoolCode } = req.params;
  const rows = await all(
    `SELECT id, full_name, phone, email
     FROM members_parents
     WHERE school_code = ?`,
    [schoolCode]
  );
  res.json(rows);
});

// إضافة ولي أمر
router.post('/:schoolCode', auth, async (req, res) => {
  const { schoolCode } = req.params;
  const { full_name, phone, email } = req.body;

  await run(
    `INSERT INTO members_parents (school_code, full_name, phone, email)
     VALUES (?, ?, ?, ?)`,
    [schoolCode, full_name, phone || null, email || null]
  );

  res.status(201).json({ success: true });
});

export default router;
