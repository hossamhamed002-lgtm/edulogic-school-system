import { Router } from 'express';
import { db } from '../../db/sqlite.js';
import { signToken } from '../../utils/jwt.js';

const router = Router();

router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ ok: false, message: 'Invalid developer credentials' });
    }

    const envUser = process.env.DEV_USERNAME;
    const envPass = process.env.DEV_PASSWORD;

    let user = null;

    if (envUser && envPass && username === envUser && password === envPass) {
      user = { id: 'ENV', username: envUser, is_active: 1, password_hash: envPass };
    } else {
      const dbUser = db
        .prepare(
          `SELECT id, username, password_hash, role, is_active
           FROM developer_users
           WHERE username = ?`
        )
        .get(username);
      if (dbUser && dbUser.is_active === 1 && dbUser.password_hash === password) {
        user = dbUser;
      }
    }

    if (!user) {
      return res.status(401).json({ ok: false, message: 'Invalid developer credentials' });
    }

    const token = signToken({
      userId: user.id,
      role: 'DEVELOPER',
      scope: 'SYSTEM'
    });

    return res.json({
      ok: true,
      token,
      role: 'developer'
    });
  } catch (err) {
    console.error('POST /dev/login error', err);
    return res.status(500).json({ ok: false, message: 'Failed to login' });
  }
});

export default router;
