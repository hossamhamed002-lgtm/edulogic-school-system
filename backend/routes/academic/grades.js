import { Router } from 'express';
import { getOne, run, all } from '../../db/sqlite.js';
import authJwt from '../../middlewares/authJwt.js';

const router = Router();

router.get('/:schoolCode', authJwt, async (req, res) => {
  try {
    const { schoolCode } = req.params;
    const row = getOne('SELECT data FROM academic_grades WHERE schoolCode = ?', [schoolCode]);
    if (!row?.data) return res.json([]);
    return res.json(JSON.parse(row.data || '[]'));
  } catch (err) {
    console.error('GET /academic/grades error', err);
    return res.json([]);
  }
});

router.post('/:schoolCode', authJwt, async (req, res) => {
  const { schoolCode } = req.params;
  const payload = Array.isArray(req.body) ? req.body : [];
  const data = JSON.stringify(payload);
  run(
    `INSERT INTO academic_grades (schoolCode, data) VALUES (?, ?)
     ON CONFLICT(schoolCode) DO UPDATE SET data=excluded.data`,
    [schoolCode, data]
  );
  res.status(201).json({ success: true });
});

// تحديث صف
router.put('/:id', authJwt, async (req, res) => {
  const { id } = req.params;
  const { name, order_index = 0, stage_id } = req.body;
  run(
    `UPDATE academic_grades
     SET name = ?, order_index = ?, stage_id = ?
     WHERE id = ?`,
    [name, order_index, stage_id, id]
  );
  res.json({ success: true });
});

// حذف صف مع حماية الفصول
router.delete('/:id', authJwt, async (req, res) => {
  const { id } = req.params;
  const classes = await all(`SELECT id FROM academic_classes WHERE grade_id = ?`, [id]);
  if (classes.length > 0) {
    return res.status(400).json({ error: 'لا يمكن حذف الصف لوجود فصول تابعة له' });
  }
  run(`DELETE FROM academic_grades WHERE id = ?`, [id]);
  res.json({ success: true });
});

export default router;
