import { Router } from 'express';
import authJwt from '../../middlewares/authJwt.js';
import { all, run } from '../../db/sqlite.js';

const router = Router();

// GET /schools
router.get('/', authJwt, async (_req, res) => {
  const rows = await all(`SELECT * FROM core_schools`);
  res.json(rows);
});

// POST /schools
router.post('/', authJwt, async (req, res) => {
  const { school_code, name, is_active = 1 } = req.body;
  await run(
    `INSERT INTO core_schools (school_code, name, is_active)
     VALUES (?, ?, ?)`,
    [school_code, name, is_active ? 1 : 0]
  );
  res.status(201).json({ success: true });
});

export default router;
