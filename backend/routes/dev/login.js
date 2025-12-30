import { Router } from 'express';
import { db } from '../../db/sqlite.js';
import { signToken } from '../../utils/jwt.js';

const router = Router();

router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'Missing credentials' });
    }

    const user = db
      .prepare(
        `SELECT id, username, password_hash, role, is_active
         FROM developer_users
         WHERE username = ?`
      )
      .get(username);

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (user.is_active !== 1) return res.status(403).json({ error: 'Invalid credentials' });
    if (user.password_hash !== password) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken({
      userId: user.id,
      role: 'DEVELOPER',
      scope: 'SYSTEM'
    });

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: 'DEVELOPER',
        scope: 'SYSTEM'
      }
    });
  } catch (err) {
    console.error('POST /dev/login error', err);
    return res.status(500).json({ error: 'Failed to login' });
  }
});

export default router;

