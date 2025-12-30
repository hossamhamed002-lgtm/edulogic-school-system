import { Router } from 'express';
import authToken from '../../middleware/authToken.js';
import { all, run } from '../../db/sqlite.js';

const router = Router();

// جلب الأعوام الدراسية
router.get('/:schoolCode', authToken, async (req, res) => {
  const { schoolCode } = req.params;
  const rows = await all(
    `SELECT * FROM academic_years
     WHERE school_code = ?
     ORDER BY id DESC`,
    [schoolCode]
  );
  res.json(rows);
});

// إضافة عام
router.post('/:schoolCode', authToken, async (req, res) => {
  const { schoolCode } = req.params;
  const { name, start_date, end_date, is_active = 0 } = req.body;

  if (is_active === 1) {
    await run(
      `UPDATE academic_years
       SET is_active = 0
       WHERE school_code = ?`,
      [schoolCode]
    );
  }

  await run(
    `INSERT INTO academic_years
     (school_code, name, start_date, end_date, is_active)
     VALUES (?, ?, ?, ?, ?)`,
    [schoolCode, name, start_date || null, end_date || null, is_active ? 1 : 0]
  );

  res.status(201).json({ success: true });
});

// تعديل عام
router.put('/:id', authToken, async (req, res) => {
  const { id } = req.params;
  const { name, start_date, end_date, is_active = 0, school_code } = req.body;

  if (is_active === 1 && school_code) {
    await run(
      `UPDATE academic_years
       SET is_active = 0
       WHERE school_code = ?`,
      [school_code]
    );
  }

  await run(
    `UPDATE academic_years
     SET name = ?, start_date = ?, end_date = ?, is_active = ?
     WHERE id = ?`,
    [name, start_date || null, end_date || null, is_active ? 1 : 0, id]
  );

  res.json({ success: true });
});

// حذف عام
router.delete('/:id', authToken, async (req, res) => {
  const { id } = req.params;
  await run(`DELETE FROM academic_years WHERE id = ?`, [id]);
  res.json({ success: true });
});

export default router;
