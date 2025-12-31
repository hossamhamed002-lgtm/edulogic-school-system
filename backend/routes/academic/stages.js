import { Router } from 'express';
import { getOne, run, all } from '../../db/sqlite.js';
import authToken from '../../middleware/authToken.js';

const router = Router();

router.get('/:schoolCode', authToken, async (req, res) => {
  try {
    const { schoolCode } = req.params;
    const row = getOne('SELECT data FROM academic_stages WHERE schoolCode = ?', [schoolCode]);
    if (!row?.data) return res.json([]);
    return res.json(JSON.parse(row.data || '[]'));
  } catch (err) {
    console.error('GET /academic/stages error', err);
    return res.json([]);
  }
});

router.post('/:schoolCode', authToken, async (req, res) => {
  const { schoolCode } = req.params;
  const payload = Array.isArray(req.body) ? req.body : [];
  const data = JSON.stringify(payload);
  run(
    `INSERT INTO academic_stages (schoolCode, data) VALUES (?, ?)
     ON CONFLICT(schoolCode) DO UPDATE SET data=excluded.data`,
    [schoolCode, data]
  );
  res.status(201).json({ success: true });
});

// تحديث مرحلة
router.put('/:id', authToken, async (req, res) => {
  const { id } = req.params;
  const { name, order_index = 0 } = req.body;
  run(
    `UPDATE academic_stages
     SET name = ?, order_index = ?
     WHERE id = ?`,
    [name, order_index, id]
  );
  res.json({ success: true });
});

// حذف مرحلة مع حماية الصفوف التابعة
router.delete('/:id', authToken, async (req, res) => {
  const { id } = req.params;
  const grades = await all(`SELECT id FROM academic_grades WHERE stage_id = ?`, [id]);
  if (grades.length > 0) {
    return res.status(400).json({ error: 'لا يمكن حذف المرحلة لوجود صفوف تابعة لها' });
  }
  run(`DELETE FROM academic_stages WHERE id = ?`, [id]);
  res.json({ success: true });
});

export default router;
