import { Router } from 'express';
import { all, run } from '../../db/sqlite.js';
import authToken from '../../middleware/authToken.js';

const auth = authToken;
const router = Router();

// جلب العاملين
router.get('/:schoolCode', auth, async (req, res) => {
  const { schoolCode } = req.params;
  const rows = await all(
    `SELECT id, full_name, job_title, phone, email
     FROM members_staff
     WHERE school_code = ?`,
    [schoolCode]
  );
  res.json(rows);
});

// إضافة عامل
router.post('/:schoolCode', auth, async (req, res) => {
  const { schoolCode } = req.params;
  const { full_name, job_title, phone, email } = req.body;

  await run(
    `INSERT INTO members_staff (school_code, full_name, job_title, phone, email)
     VALUES (?, ?, ?, ?, ?)`,
    [schoolCode, full_name, job_title || null, phone || null, email || null]
  );

  res.status(201).json({ success: true });
});

export default router;
