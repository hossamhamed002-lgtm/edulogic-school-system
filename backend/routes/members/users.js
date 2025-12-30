import { Router } from 'express';
import { db } from '../../db/sqlite.js';

const router = Router();

const selectStmt = db.prepare(`
  SELECT id, username, role, is_active
  FROM members_users
  WHERE school_code = ?
`);

const selectUserByUsername = db.prepare(`
  SELECT id FROM members_users WHERE school_code = ? AND username = ?
`);

const updateUser = db.prepare(`
  UPDATE members_users
  SET password_hash = ?, role = ?, is_active = ?
  WHERE id = ?
`);

const insertUser = db.prepare(`
  INSERT INTO members_users (school_code, username, password_hash, role, is_active)
  VALUES (?, ?, ?, ?, ?)
`);

router.post('/members/users/:schoolCode', (req, res) => {
  try {
    const schoolCode = req.params.schoolCode;
    const users = Array.isArray(req.body) ? req.body : [];

    const tx = db.transaction((items) => {
      for (const user of items) {
        const existing = selectUserByUsername.get(schoolCode, user.username);
        if (existing) {
          updateUser.run(
            user.password || '',
            user.role || '',
            user.active ? 1 : 0,
            existing.id
          );
        } else {
          insertUser.run(
            schoolCode,
            user.username,
            user.password || '',
            user.role || '',
            user.active ? 1 : 0
          );
        }
      }
    });

    tx(users);
    return res.json({ success: true });
  } catch (err) {
    console.error('POST /members/users error', err);
    return res.status(500).json({ error: 'Failed to save users' });
  }
});

router.get('/members/users/:schoolCode', (req, res) => {
  try {
    const rows = selectStmt.all(req.params.schoolCode);
    const result = rows.map((row) => ({
      id: row.id,
      username: row.username,
      role: row.role,
      active: row.is_active === 1
    }));
    return res.json(result);
  } catch (err) {
    console.error('GET /members/users error', err);
    return res.status(500).json({ error: 'Failed to load users' });
  }
});

export default router;
