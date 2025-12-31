import { Router } from 'express';
import { db } from '../../db/sqlite.js';
import { signToken } from '../../utils/jwt.js';
import jwt from 'jsonwebtoken';

const router = Router();

const devAuthOnly = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ ok: false, message: 'Missing developer token' });
  }
  try {
    const decoded = jwt.verify(parts[1], process.env.JWT_SECRET || 'dev-secret');
    const role = (decoded.role || '').toUpperCase();
    const scope = (decoded.scope || '').toUpperCase();
    const source = (decoded.source || '').toLowerCase();
    if (role !== 'DEVELOPER' && scope !== 'SYSTEM' && source !== 'developer') {
      return res.status(403).json({ ok: false, message: 'Forbidden' });
    }
    req.user = decoded;
    return next();
  } catch {
    return res.status(401).json({ ok: false, message: 'Invalid developer token' });
  }
};

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

// Impersonate a school as ADMIN (developer-only)
router.post('/impersonate-school', devAuthOnly, (req, res) => {
  try {
    const schoolCode = req.body?.schoolCode || req.body?.schoolId;
    if (!schoolCode) {
      return res.status(400).json({ ok: false, message: 'Missing schoolCode' });
    }

    const role = (req.user?.role || '').toUpperCase();
    const source = (req.user?.source || '').toLowerCase();

    if (role !== 'DEVELOPER' && source !== 'developer' && (req.user?.scope || '').toUpperCase() !== 'SYSTEM') {
      return res.status(403).json({ ok: false, message: 'Forbidden' });
    }

    // Ensure school exists (provision if missing)
    const scopedCode = String(schoolCode).trim().toUpperCase();
    const schoolRow = db
      .prepare('SELECT data FROM schools_master WHERE schoolCode = ?')
      .get(scopedCode);
    if (!schoolRow) {
      const payload = {
        name: 'مدرسة تحت الإعداد',
        status: 'active',
        createdBy: 'developer',
        isProvisioned: false,
        createdAt: new Date().toISOString()
      };
      db.prepare('INSERT OR REPLACE INTO schools_master (schoolCode, data) VALUES (?, ?)').run(scopedCode, JSON.stringify(payload));
    }

    // Ensure admin user exists (optional)
    const adminUsername = `DEV-ADMIN-${scopedCode}`;
    const existingAdmin = db
      .prepare('SELECT id FROM members_users WHERE school_code = ? AND username = ?')
      .get(scopedCode, adminUsername);
    if (!existingAdmin) {
      db.prepare(`
        INSERT INTO members_users (school_code, username, password_hash, role, is_active)
        VALUES (?, ?, ?, ?, 1)
      `).run(scopedCode, adminUsername, 'dev-admin', 'ADMIN');
    }

    const token = signToken({
      userId: `DEV-IMPERSONATE-${scopedCode}`,
      role: 'ADMIN',
      schoolCode: scopedCode,
      impersonatedBy: 'developer',
      source: 'dev_impersonation'
    });

    return res.json({
      ok: true,
      token,
      role: 'ADMIN',
      schoolCode: scopedCode,
      source: 'dev_impersonation'
    });
  } catch (err) {
    console.error('POST /dev/impersonate-school error', err);
    return res.status(500).json({ ok: false, message: 'Failed to impersonate school' });
  }
});

export default router;
