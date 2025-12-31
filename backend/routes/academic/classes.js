import { Router } from 'express';
import { getOne, run } from '../../db/sqlite.js';
import authToken from '../../middleware/authToken.js';

const router = Router();

router.get('/:schoolCode', authToken, async (req, res) => {
  try {
    const { schoolCode } = req.params;
    const row = getOne('SELECT data FROM academic_classes WHERE schoolCode = ?', [schoolCode]);
    if (!row?.data) return res.json([]);
    return res.json(JSON.parse(row.data || '[]'));
  } catch (err) {
    console.error('GET /academic/classes error', err);
    return res.json([]);
  }
});

router.post('/:schoolCode', authToken, async (req, res) => {
  const { schoolCode } = req.params;
  const payload = Array.isArray(req.body) ? req.body : [];
  const data = JSON.stringify(payload);
  run(
    `INSERT INTO academic_classes (schoolCode, data) VALUES (?, ?)
     ON CONFLICT(schoolCode) DO UPDATE SET data=excluded.data`,
    [schoolCode, data]
  );
  res.status(201).json({ success: true });
});

// تحديث فصل
router.put('/:id', authToken, async (req, res) => {
  const { id } = req.params;
  const { name, grade_id } = req.body;
  run(
    `UPDATE academic_classes
     SET name = ?, grade_id = ?
     WHERE id = ?`,
    [name, grade_id, id]
  );
  res.json({ success: true });
});

// حذف فصل
router.delete('/:id', authToken, async (req, res) => {
  const { id } = req.params;
  run(`DELETE FROM academic_classes WHERE id = ?`, [id]);
  res.json({ success: true });
});

export default router;
