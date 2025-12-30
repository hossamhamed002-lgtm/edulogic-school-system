import path from 'path';
import Database from 'better-sqlite3';

const DB_PATH = process.env.DB_PATH || './school.db';
const resolvedPath = path.resolve(DB_PATH);

export const db = new Database(resolvedPath);

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
