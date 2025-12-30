import path from 'path';
import Database from 'better-sqlite3';

const DB_PATH = process.env.DB_PATH || './school.db';
const resolvedPath = path.resolve(DB_PATH);

export const db = new Database(resolvedPath);

// Initialize members_users table and seed default admin if missing
db.prepare(`
  CREATE TABLE IF NOT EXISTS members_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_code TEXT NOT NULL,
    username TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    UNIQUE (school_code, username)
  )
`).run();

db.prepare(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_members_users_school_username
  ON members_users (school_code, username)
`).run();

const existingAdmin = db
  .prepare(
    `SELECT 1 FROM members_users WHERE school_code = ? AND username = ? LIMIT 1`
  )
  .get('SCHOOL1', 'admin');

if (!existingAdmin) {
  db.prepare(
    `INSERT INTO members_users (school_code, username, password_hash, role, is_active)
     VALUES (?, ?, ?, ?, ?)`
  ).run('SCHOOL1', 'admin', '1234', 'ADMIN', 1);
}

export const getOne = (sql, params = []) => {
  const stmt = db.prepare(sql);
  return stmt.get(...params);
};

export const getAll = (sql, params = []) => {
  const stmt = db.prepare(sql);
  return stmt.all(...params);
};

export const run = (sql, params = []) => {
  const stmt = db.prepare(sql);
  stmt.run(...params);
};

// alias للتوافق مع تسميات أخرى
export const all = getAll;
export const get = getOne;
