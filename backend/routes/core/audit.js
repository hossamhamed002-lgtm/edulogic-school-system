import { Router } from 'express';
import authToken from '../../middleware/authToken.js';
import { all, run } from '../../db/sqlite.js';

const router = Router();

// GET /audit/:schoolCode
router.get('/:schoolCode', authToken, async (req, res) => {
  const rows = await all(
    `SELECT * FROM core_audit_logs
     WHERE school_code = ?
     ORDER BY id DESC
     LIMIT 200`,
    [req.params.schoolCode]
  );
  res.json(rows);
});

// POST /audit
router.post('/', authToken, async (req, res) => {
  const { school_code, action, details } = req.body;
  await run(
    `INSERT INTO core_audit_logs (school_code, user_id, action, details, ip)
     VALUES (?, ?, ?, ?, ?)`,
    [
      school_code,
      req.user?.id || null,
      action,
      details || null,
      req.ip
    ]
  );
  res.status(201).json({ success: true });
});

export default router;
