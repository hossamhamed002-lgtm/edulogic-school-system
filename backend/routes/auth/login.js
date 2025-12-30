import { Router } from 'express';
import { db } from '../../db/sqlite.js';
import { signToken } from '../../utils/jwt.js';

const router = Router();

const selectUser = db.prepare(`
  SELECT id, username, password_hash, role, is_active
  FROM members_users
  WHERE school_code = ? AND username = ?
  LIMIT 1
`);

router.post('/auth/login', (req, res) => {
  try {
    const { schoolCode, username, password } = req.body || {};
    if (!schoolCode || !username || !password) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = selectUser.get(schoolCode, username);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    if (user.is_active !== 1) return res.status(401).json({ message: 'Invalid credentials' });
    if (password !== user.password_hash) return res.status(401).json({ message: 'Invalid credentials' });

    const token = signToken({
      userId: user.id,
      schoolCode,
      role: user.role
    });

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        schoolCode
      }
    });
  } catch (err) {
    console.error('POST /auth/login error', err);
    return res.status(500).json({ message: 'Invalid credentials' });
  }
});

export default router;
