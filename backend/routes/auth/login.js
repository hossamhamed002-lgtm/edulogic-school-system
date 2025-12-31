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

const ensureSchool = (schoolCode) => {
  const existing = db
    .prepare('SELECT data FROM schools_master WHERE schoolCode = ?')
    .get(schoolCode);
  if (!existing) {
    const payload = {
      name: 'مدرسة تحت الإعداد',
      status: 'active',
      createdBy: 'auto_provision',
      isProvisioned: false,
      createdAt: new Date().toISOString()
    };
    db.prepare('INSERT OR REPLACE INTO schools_master (schoolCode, data) VALUES (?, ?)').run(schoolCode, JSON.stringify(payload));
  }
};

const ensureAdminUser = (schoolCode, username, password) => {
  const existingAdmin = db
    .prepare('SELECT id FROM members_users WHERE school_code = ? AND username = ?')
    .get(schoolCode, username);
  if (!existingAdmin) {
    db.prepare(`
      INSERT INTO members_users (school_code, username, password_hash, role, is_active)
      VALUES (?, ?, ?, ?, 1)
    `).run(schoolCode, username, password, 'ADMIN');
  }
};

router.post('/auth/login', (req, res) => {
  try {
    const { schoolCode, username, password } = req.body || {};
    if (!schoolCode || !username || !password) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const scopedCode = String(schoolCode).trim().toUpperCase();

    let user = selectUser.get(scopedCode, username);
    if (!user || user.is_active !== 1 || password !== user.password_hash) {
      // Auto-provision school/admin if missing or mismatched
      ensureSchool(scopedCode);
      ensureAdminUser(scopedCode, username, password);
      user = selectUser.get(scopedCode, username);
    }

    if (!user || user.is_active !== 1 || password !== user.password_hash) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signToken({
      userId: user.id,
      schoolCode: scopedCode,
      role: user.role
    });

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        schoolCode: scopedCode
      }
    });
  } catch (err) {
    console.error('POST /auth/login error', err);
    return res.status(500).json({ message: 'Invalid credentials' });
  }
});

export default router;
