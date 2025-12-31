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

db.prepare(`
  CREATE TABLE IF NOT EXISTS developer_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    is_active INTEGER DEFAULT 1
  )
`).run();

db.prepare(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_developer_users_username
  ON developer_users (username)
`).run();

// الأكاديمي: جداول مرنة تخزن JSON لكل مدرسة مع أعمدة مساعدة لتجنب أخطاء 500 عند عدم وجود بيانات
db.prepare(`
  CREATE TABLE IF NOT EXISTS academic_years (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_code TEXT NOT NULL,
    name TEXT,
    start_date TEXT,
    end_date TEXT,
    is_active INTEGER DEFAULT 0
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS academic_stages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    schoolCode TEXT NOT NULL UNIQUE,
    data TEXT,
    name TEXT,
    order_index INTEGER DEFAULT 0
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS academic_grades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    schoolCode TEXT NOT NULL UNIQUE,
    data TEXT,
    name TEXT,
    order_index INTEGER DEFAULT 0,
    stage_id INTEGER
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS academic_classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    schoolCode TEXT NOT NULL UNIQUE,
    data TEXT,
    name TEXT,
    grade_id INTEGER
  )
`).run();

// المالية: جداول لكل مدرسة
db.prepare(`
  CREATE TABLE IF NOT EXISTS finance_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_code TEXT NOT NULL,
    code TEXT,
    name TEXT,
    type TEXT,
    parent_id INTEGER
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS finance_fee_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_code TEXT NOT NULL,
    name TEXT,
    amount REAL DEFAULT 0
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS finance_fee_structure (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_code TEXT NOT NULL,
    stage_id INTEGER,
    grade_id INTEGER,
    total_amount REAL DEFAULT 0
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS finance_journal (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_code TEXT NOT NULL,
    entry_date TEXT,
    description TEXT
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS finance_receipts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_code TEXT NOT NULL,
    receipt_date TEXT,
    amount REAL DEFAULT 0,
    description TEXT
  )
`).run();

const existingDev = db
  .prepare(
    `SELECT 1 FROM developer_users WHERE username = ? LIMIT 1`
  )
  .get('PRO-2025-ADMIN-MASTER');

if (!existingDev) {
  db.prepare(
    `INSERT INTO developer_users (username, password_hash, role, is_active)
     VALUES (?, ?, ?, ?)`
  ).run('PRO-2025-ADMIN-MASTER', 'Dev123', 'DEVELOPER', 1);
}

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
