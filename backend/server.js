import express from 'express';
import 'dotenv/config';
import Database from 'better-sqlite3';
import jwt from 'jsonwebtoken';
import academicRoutes from './routes/academic/index.js';
import membersRoutes from './routes/members/index.js';
import authRoutes from './routes/auth/login.js';
import rateLimit from './utils/rateLimit.js';
import membersUsersRoutes from './routes/members/users.js';
import authJwt from './middlewares/authJwt.js';
import rolePermissions from './middlewares/rolePermissions.js';
import devLoginRouter from './routes/dev/login.js';
import { requireRole } from './middlewares/requireRole.js';
import backupsRouter from './routes/core/backups.js';
import financeRoutes from './routes/finance/index.js';
import coreRoutes from './routes/core/index.js';

const app = express();
const PORT = process.env.PORT;
if (!PORT) {
  console.error('❌ PORT is undefined — Render will not route traffic');
}
const DB_PATH = process.env.DB_PATH || './school.db';

const allowedOrigins = new Set([
  'https://edulogic-school-system.pages.dev',
  'http://localhost:3003',
  'http://localhost:3000',
  'http://localhost:5173'
]);

const applyCorsHeaders = (req, res) => {
  const origin = req.headers.origin || '';
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
};

/* ===== FORCE OPTIONS FIRST ===== */
app.options('*', (req, res) => {
  applyCorsHeaders(req, res);
  return res.sendStatus(204);
});

/* ===== CORS FOR ALL REQUESTS ===== */
app.use((req, res, next) => {
  applyCorsHeaders(req, res);
  next();
});

app.get("/health", (req, res) => {
  res.status(200).json({ ok: true, service: "schoolpaypro-api", status: "ok", source: "express" });
});

app.use(express.json({ limit: '5mb' }));

app.use('/api', rateLimit);

const db = new Database(DB_PATH);

db.prepare(`
  CREATE TABLE IF NOT EXISTS school_info (
    academicYear TEXT PRIMARY KEY,
    data TEXT NOT NULL
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS students (
    academicYear TEXT PRIMARY KEY,
    data TEXT NOT NULL
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS employees (
    schoolCode TEXT PRIMARY KEY,
    data TEXT NOT NULL
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS academic_years (
    schoolCode TEXT PRIMARY KEY,
    data TEXT NOT NULL
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS academic_stages (
    schoolCode TEXT PRIMARY KEY,
    data TEXT NOT NULL
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS academic_grades (
    schoolCode TEXT PRIMARY KEY,
    data TEXT NOT NULL
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS academic_classes (
    schoolCode TEXT PRIMARY KEY,
    data TEXT NOT NULL
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS finance_receipts (
    schoolCode TEXT PRIMARY KEY,
    data TEXT NOT NULL
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS finance_journal (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_code TEXT NOT NULL,
    entry_date TEXT NOT NULL,
    description TEXT
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS finance_journal_lines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    journal_id INTEGER NOT NULL,
    account_id INTEGER NOT NULL,
    debit REAL DEFAULT 0,
    credit REAL DEFAULT 0
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS finance_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_code TEXT NOT NULL,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    parent_id INTEGER
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS finance_banks (
    schoolCode TEXT PRIMARY KEY,
    data TEXT NOT NULL
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS finance_suppliers (
    schoolCode TEXT PRIMARY KEY,
    data TEXT NOT NULL
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS finance_fee_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_code TEXT NOT NULL,
    name TEXT NOT NULL,
    amount REAL NOT NULL
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS finance_fee_structure (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_code TEXT NOT NULL,
    stage_id INTEGER,
    grade_id INTEGER,
    total_amount REAL
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS members_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_code TEXT NOT NULL,
    username TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    is_active INTEGER DEFAULT 1
  )
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
  CREATE TABLE IF NOT EXISTS audit_logs (
    schoolCode TEXT PRIMARY KEY,
    data TEXT NOT NULL
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS store_inventory_types (
    schoolCode TEXT PRIMARY KEY,
    data TEXT NOT NULL
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS store_inventory_type_seq (
    schoolCode TEXT PRIMARY KEY,
    value INTEGER NOT NULL
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS store_inventory_auto_seq (
    schoolCode TEXT PRIMARY KEY,
    value INTEGER NOT NULL
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS store_fixed_assets (
    schoolCode TEXT PRIMARY KEY,
    data TEXT NOT NULL
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS store_fixed_asset_seq (
    schoolCode TEXT PRIMARY KEY,
    value INTEGER NOT NULL
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS store_stock_receives (
    schoolCode TEXT PRIMARY KEY,
    data TEXT NOT NULL
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS store_stock_issues (
    schoolCode TEXT PRIMARY KEY,
    data TEXT NOT NULL
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS store_goods_in (
    schoolCode TEXT PRIMARY KEY,
    data TEXT NOT NULL
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS store_stock_movement (
    schoolCode TEXT PRIMARY KEY,
    data TEXT NOT NULL
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS store_voucher_seq (
    schoolCode TEXT PRIMARY KEY,
    value INTEGER NOT NULL
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS store_auto_seq (
    schoolCode TEXT PRIMARY KEY,
    value INTEGER NOT NULL
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS members_parents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_code TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS rules_config (
    schoolCode TEXT PRIMARY KEY,
    data TEXT NOT NULL
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS schools_master (
    schoolCode TEXT PRIMARY KEY,
    data TEXT NOT NULL
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS hr_attendance_records (
    schoolCode TEXT PRIMARY KEY,
    data TEXT NOT NULL
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS hr_operational_records (
    schoolCode TEXT PRIMARY KEY,
    data TEXT NOT NULL
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS hr_payroll_draft (
    schoolCode TEXT PRIMARY KEY,
    data TEXT NOT NULL
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS members_staff (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_code TEXT NOT NULL,
    full_name TEXT NOT NULL,
    job_title TEXT,
    phone TEXT,
    email TEXT
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS report_settings (
    schoolCode TEXT PRIMARY KEY,
    data TEXT NOT NULL
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS financial_close_flags (
    schoolCode TEXT PRIMARY KEY,
    data TEXT NOT NULL
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS otp_device_trust (
    schoolCode TEXT PRIMARY KEY,
    data TEXT NOT NULL
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS local_backups (
    schoolCode TEXT PRIMARY KEY,
    data TEXT NOT NULL
  )
`).run();

// Core system tables
db.prepare(`
  CREATE TABLE IF NOT EXISTS core_schools (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS core_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_code TEXT NOT NULL,
    key TEXT NOT NULL,
    value TEXT
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS core_audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_code TEXT,
    user_id INTEGER,
    action TEXT NOT NULL,
    details TEXT,
    ip TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// Bootstrap default admin user if none exists
(() => {
  const { cnt } = db.prepare('SELECT COUNT(*) AS cnt FROM members_users').get();
  if (cnt === 0) {
    db.prepare(`
      INSERT INTO members_users (school_code, username, password_hash, role, is_active)
      VALUES (?, ?, ?, ?, ?)
    `).run('SCHOOL1', 'admin', '1234', 'ADMIN', 1);
    console.log('Default admin user created');
  }
})();

// Bootstrap developer account
(() => {
  const { cnt } = db.prepare('SELECT COUNT(*) AS cnt FROM developer_users').get();
  if (cnt === 0) {
    db.prepare(`
      INSERT INTO developer_users (username, password_hash, role, is_active)
      VALUES (?, ?, ?, ?)
    `).run('PRO-2025-ADMIN-MASTER', 'Dev123', 'DEVELOPER', 1);
  }
  console.log('Developer account ready');
})();

app.use(authRoutes);

app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'school-info', port: PORT });
});

app.get('/favicon.ico', (_req, res) => {
  res.status(204).end();
});

// Health/version
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: process.env.npm_package_version || '1.0.0',
    time: new Date().toISOString()
  });
});

// Developer routes (public login + protected subs)
app.use('/dev', devLoginRouter);

app.use(authJwt);
app.use(rolePermissions);

// Academic/Finance/Members routes (protected)
app.use('/academic', academicRoutes);
app.use('/members', membersRoutes);
app.use('/finance', financeRoutes);
app.use('/', coreRoutes);

// Protected routers
app.use(membersUsersRoutes);

app.get('/school-info/:year', (req, res) => {
  try {
    const row = db
      .prepare('SELECT data FROM school_info WHERE academicYear = ?')
      .get(req.params.year);
    if (!row) return res.json(null);
    return res.json(JSON.parse(row.data));
  } catch (err) {
    console.error('GET /school-info error', err);
    return res.json(null);
  }
});

app.post('/school-info/:year', (req, res) => {
  try {
    const payload = JSON.stringify(req.body || {});
    db.prepare(`
      INSERT OR REPLACE INTO school_info (academicYear, data)
      VALUES (?, ?)
    `).run(req.params.year, payload);
    return res.json({ success: true });
  } catch (err) {
    console.error('POST /school-info error', err);
    return res.json({ success: false });
  }
});

app.get('/students/:year', (req, res) => {
  try {
    const row = db
      .prepare('SELECT data FROM students WHERE academicYear = ?')
      .get(req.params.year);
    if (!row) return res.json([]);
    return res.json(JSON.parse(row.data));
  } catch (err) {
    console.error('GET /students error', err);
    return res.json([]);
  }
});

app.post('/students/:year', (req, res) => {
  try {
    const payload = JSON.stringify(req.body || []);
    db.prepare(`
      INSERT OR REPLACE INTO students (academicYear, data)
      VALUES (?, ?)
    `).run(req.params.year, payload);
    return res.json({ success: true });
  } catch (err) {
    console.error('POST /students error', err);
    return res.json({ success: false });
  }
});

app.get('/employees/:schoolCode', (req, res) => {
  try {
    const row = db
      .prepare('SELECT data FROM employees WHERE schoolCode = ?')
      .get(req.params.schoolCode);
    if (!row) return res.json([]);
    return res.json(JSON.parse(row.data));
  } catch (err) {
    console.error('GET /employees error', err);
    return res.json([]);
  }
});

app.post('/employees/:schoolCode', (req, res) => {
  try {
    const payload = JSON.stringify(req.body || []);
    db.prepare(`
      INSERT OR REPLACE INTO employees (schoolCode, data)
      VALUES (?, ?)
    `).run(req.params.schoolCode, payload);
    return res.json({ success: true });
  } catch (err) {
    console.error('POST /employees error', err);
    return res.json({ success: false });
  }
});

const createJsonTable = (table, keyColumn) => {
  try {
    db.prepare(`
      CREATE TABLE IF NOT EXISTS ${table} (
        ${keyColumn} TEXT PRIMARY KEY,
        data TEXT NOT NULL
      )
    `).run();
  } catch (err) {
    console.error(`createJsonTable ${table} failed`, err);
  }
};

const resolveKey = (req, keyColumn = 'schoolCode') =>
  req.params?.[keyColumn]
  || req.params?.schoolCode
  || req.params?.year
  || req.body?.[keyColumn]
  || req.query?.[keyColumn]
  || req.body?.schoolCode
  || req.query?.schoolCode
  || '';

const makeSafeHandler = (table, options = {}) => {
  const keyColumn = options.keyColumn || 'schoolCode';
  const targetTable = options.storageTable || table;
  const emptyValue = options.emptyValue ?? [];

  createJsonTable(targetTable, keyColumn);

  return {
    get: (req, res) => {
      try {
        const key = resolveKey(req, keyColumn);
        if (!key) return res.json(emptyValue);
        const row = db
          .prepare(`SELECT data FROM ${targetTable} WHERE ${keyColumn} = ?`)
          .get(key);
        if (!row) return res.json(emptyValue);
        try {
          return res.json(JSON.parse(row.data));
        } catch {
          return res.json(emptyValue);
        }
      } catch (err) {
        console.error(`GET /${table} error`, err);
        return res.json(emptyValue);
      }
    },
    post: (req, res) => {
      try {
        const key = resolveKey(req, keyColumn);
        const payload = JSON.stringify(req.body ?? emptyValue);
        db.prepare(`
          INSERT OR REPLACE INTO ${targetTable} (${keyColumn}, data)
          VALUES (?, ?)
        `).run(key, payload);
        return res.json({ success: true });
      } catch (err) {
        console.error(`POST /${table} error`, err);
        return res.json({ success: false });
      }
    }
  };
};

const yearsHandler = makeSafeHandler('academic_years');
app.get('/academic/years/:schoolCode', requireRole(['ADMIN', 'STAFF']), yearsHandler.get);
app.post('/academic/years/:schoolCode', requireRole(['ADMIN', 'STAFF']), yearsHandler.post);

const stagesHandler = makeSafeHandler('academic_stages');
app.get('/academic/stages/:schoolCode', requireRole(['ADMIN', 'STAFF']), stagesHandler.get);
app.post('/academic/stages/:schoolCode', requireRole(['ADMIN', 'STAFF']), stagesHandler.post);

const gradesHandler = makeSafeHandler('academic_grades');
app.get('/academic/grades/:schoolCode', requireRole(['ADMIN', 'STAFF']), gradesHandler.get);
app.post('/academic/grades/:schoolCode', requireRole(['ADMIN', 'STAFF']), gradesHandler.post);

const classesHandler = makeSafeHandler('academic_classes');
app.get('/academic/classes/:schoolCode', requireRole(['ADMIN', 'STAFF']), classesHandler.get);
app.post('/academic/classes/:schoolCode', requireRole(['ADMIN', 'STAFF']), classesHandler.post);

const receiptsHandler = makeSafeHandler('finance_receipts');
app.get('/finance/receipts/:schoolCode', requireRole(['ADMIN']), receiptsHandler.get);
app.post('/finance/receipts/:schoolCode', requireRole(['ADMIN']), receiptsHandler.post);

const journalHandler = makeSafeHandler('finance_journal', { storageTable: 'finance_journal_json' });
app.get('/finance/journal/:schoolCode', requireRole(['ADMIN']), journalHandler.get);
app.post('/finance/journal/:schoolCode', requireRole(['ADMIN']), journalHandler.post);

const accountsHandler = makeSafeHandler('finance_accounts', { storageTable: 'finance_accounts_json' });
app.get('/finance/accounts/:schoolCode', requireRole(['ADMIN']), accountsHandler.get);
app.post('/finance/accounts/:schoolCode', requireRole(['ADMIN']), accountsHandler.post);

const banksHandler = makeSafeHandler('finance_banks');
app.get('/finance/banks/:schoolCode', requireRole(['ADMIN']), banksHandler.get);
app.post('/finance/banks/:schoolCode', requireRole(['ADMIN']), banksHandler.post);

const suppliersHandler = makeSafeHandler('finance_suppliers');
app.get('/finance/suppliers/:schoolCode', requireRole(['ADMIN']), suppliersHandler.get);
app.post('/finance/suppliers/:schoolCode', requireRole(['ADMIN']), suppliersHandler.post);

const feeItemsHandler = makeSafeHandler('finance_fee_items', { storageTable: 'finance_fee_items_json' });
app.get('/finance/fee-items/:schoolCode', requireRole(['ADMIN']), feeItemsHandler.get);
app.post('/finance/fee-items/:schoolCode', requireRole(['ADMIN']), feeItemsHandler.post);

const feeStructureHandler = makeSafeHandler('finance_fee_structure', { storageTable: 'finance_fee_structure_json' });
app.get('/finance/fee-structure/:schoolCode', requireRole(['ADMIN']), feeStructureHandler.get);
app.post('/finance/fee-structure/:schoolCode', requireRole(['ADMIN']), feeStructureHandler.post);

const auditHandler = makeSafeHandler('audit_logs');
app.get('/audit/logs/:schoolCode', requireRole(['ADMIN', 'DEVELOPER']), auditHandler.get);
app.post('/audit/logs/:schoolCode', requireRole(['ADMIN', 'DEVELOPER']), auditHandler.post);

const storeTypesHandler = makeSafeHandler('store_inventory_types');
app.get('/stores/types/:schoolCode', storeTypesHandler.get);
app.post('/stores/types/:schoolCode', storeTypesHandler.post);

const storeTypeSeqHandler = {
  get: (req, res) => {
    try {
      const row = db
        .prepare('SELECT value FROM store_inventory_type_seq WHERE schoolCode = ?')
        .get(req.params.schoolCode);
      return res.json(row ? row.value : 0);
    } catch (err) {
      console.error('GET /stores/types-seq error', err);
      return res.json(0);
    }
  },
  post: (req, res) => {
    try {
      const value = Number(req.body?.value || 0);
      db.prepare(`
        INSERT OR REPLACE INTO store_inventory_type_seq (schoolCode, value)
        VALUES (?, ?)
      `).run(req.params.schoolCode, value);
      return res.json({ success: true });
    } catch (err) {
      console.error('POST /stores/types-seq error', err);
      return res.json({ success: false });
    }
  }
};
app.get('/stores/types-seq/:schoolCode', storeTypeSeqHandler.get);
app.post('/stores/types-seq/:schoolCode', storeTypeSeqHandler.post);

const storeAutoSeqHandler = {
  get: (req, res) => {
    try {
      const row = db
        .prepare('SELECT value FROM store_inventory_auto_seq WHERE schoolCode = ?')
        .get(req.params.schoolCode);
      return res.json(row ? row.value : 0);
    } catch (err) {
      console.error('GET /stores/auto-seq error', err);
      return res.json(0);
    }
  },
  post: (req, res) => {
    try {
      const value = Number(req.body?.value || 0);
      db.prepare(`
        INSERT OR REPLACE INTO store_inventory_auto_seq (schoolCode, value)
        VALUES (?, ?)
      `).run(req.params.schoolCode, value);
      return res.json({ success: true });
    } catch (err) {
      console.error('POST /stores/auto-seq error', err);
      return res.json({ success: false });
    }
  }
};
app.get('/stores/auto-seq/:schoolCode', storeAutoSeqHandler.get);
app.post('/stores/auto-seq/:schoolCode', storeAutoSeqHandler.post);

const storeAssetsHandler = makeSafeHandler('store_fixed_assets');
app.get('/stores/assets/:schoolCode', storeAssetsHandler.get);
app.post('/stores/assets/:schoolCode', storeAssetsHandler.post);

const storeAssetSeqHandler = {
  get: (req, res) => {
    try {
      const row = db
        .prepare('SELECT value FROM store_fixed_asset_seq WHERE schoolCode = ?')
        .get(req.params.schoolCode);
      return res.json(row ? row.value : 0);
    } catch (err) {
      console.error('GET /stores/assets-seq error', err);
      return res.json(0);
    }
  },
  post: (req, res) => {
    try {
      const value = Number(req.body?.value || 0);
      db.prepare(`
        INSERT OR REPLACE INTO store_fixed_asset_seq (schoolCode, value)
        VALUES (?, ?)
      `).run(req.params.schoolCode, value);
      return res.json({ success: true });
    } catch (err) {
      console.error('POST /stores/assets-seq error', err);
      return res.json({ success: false });
    }
  }
};
app.get('/stores/assets-seq/:schoolCode', storeAssetSeqHandler.get);
app.post('/stores/assets-seq/:schoolCode', storeAssetSeqHandler.post);

const stockReceiveHandler = makeSafeHandler('store_stock_receives');
app.get('/stores/receive/:schoolCode', stockReceiveHandler.get);
app.post('/stores/receive/:schoolCode', stockReceiveHandler.post);

const stockIssueHandler = makeSafeHandler('store_stock_issues');
app.get('/stores/issue/:schoolCode', stockIssueHandler.get);
app.post('/stores/issue/:schoolCode', stockIssueHandler.post);

const goodsInHandler = makeSafeHandler('store_goods_in');
app.get('/stores/goods-in/:schoolCode', goodsInHandler.get);
app.post('/stores/goods-in/:schoolCode', goodsInHandler.post);

const stockMovementHandler = makeSafeHandler('store_stock_movement');
app.get('/stores/movement/:schoolCode', stockMovementHandler.get);
app.post('/stores/movement/:schoolCode', stockMovementHandler.post);

const storeVoucherSeqHandler = {
  get: (req, res) => {
    try {
      const row = db
        .prepare('SELECT value FROM store_voucher_seq WHERE schoolCode = ?')
        .get(req.params.schoolCode);
      return res.json(row ? row.value : 0);
    } catch (err) {
      console.error('GET /stores/voucher-seq error', err);
      return res.json(0);
    }
  },
  post: (req, res) => {
    try {
      const value = Number(req.body?.value || 0);
      db.prepare(`
        INSERT OR REPLACE INTO store_voucher_seq (schoolCode, value)
        VALUES (?, ?)
      `).run(req.params.schoolCode, value);
      return res.json({ success: true });
    } catch (err) {
      console.error('POST /stores/voucher-seq error', err);
      return res.json({ success: false });
    }
  }
};
app.get('/stores/voucher-seq/:schoolCode', storeVoucherSeqHandler.get);
app.post('/stores/voucher-seq/:schoolCode', storeVoucherSeqHandler.post);

const storeAutoSeqHandler2 = {
  get: (req, res) => {
    try {
      const row = db
        .prepare('SELECT value FROM store_auto_seq WHERE schoolCode = ?')
        .get(req.params.schoolCode);
      return res.json(row ? row.value : 0);
    } catch (err) {
      console.error('GET /stores/auto-seq-v2 error', err);
      return res.json(0);
    }
  },
  post: (req, res) => {
    try {
      const value = Number(req.body?.value || 0);
      db.prepare(`
        INSERT OR REPLACE INTO store_auto_seq (schoolCode, value)
        VALUES (?, ?)
      `).run(req.params.schoolCode, value);
      return res.json({ success: true });
    } catch (err) {
      console.error('POST /stores/auto-seq-v2 error', err);
      return res.json({ success: false });
    }
  }
};
app.get('/stores/auto-seq-v2/:schoolCode', storeAutoSeqHandler2.get);
app.post('/stores/auto-seq-v2/:schoolCode', storeAutoSeqHandler2.post);

const parentsHandler = makeSafeHandler('members_parents', { storageTable: 'members_parents_json' });
app.get('/members/parents/:schoolCode', parentsHandler.get);
app.post('/members/parents/:schoolCode', parentsHandler.post);

const rulesHandler = makeSafeHandler('rules_config');
app.get('/settings/rules/:schoolCode', rulesHandler.get);
app.post('/settings/rules/:schoolCode', rulesHandler.post);

const schoolsHandler = makeSafeHandler('schools_master');
app.get('/schools/:schoolCode', schoolsHandler.get);
app.post('/schools/:schoolCode', schoolsHandler.post);

const attendanceHandler = makeSafeHandler('hr_attendance_records');
app.get('/hr/attendance/:schoolCode', attendanceHandler.get);
app.post('/hr/attendance/:schoolCode', attendanceHandler.post);

const operationalHandler = makeSafeHandler('hr_operational_records');
app.get('/hr/operational/:schoolCode', operationalHandler.get);
app.post('/hr/operational/:schoolCode', operationalHandler.post);

const payrollDraftHandler = makeSafeHandler('hr_payroll_draft');
app.get('/hr/payroll-draft/:schoolCode', payrollDraftHandler.get);
app.post('/hr/payroll-draft/:schoolCode', payrollDraftHandler.post);

const reportSettingsHandler = makeSafeHandler('report_settings');
app.get('/reports/settings/:schoolCode', reportSettingsHandler.get);
app.post('/reports/settings/:schoolCode', reportSettingsHandler.post);

const finCloseHandler = makeSafeHandler('financial_close_flags');
app.get('/finance/close-flags/:schoolCode', finCloseHandler.get);
app.post('/finance/close-flags/:schoolCode', finCloseHandler.post);

const otpTrustHandler = makeSafeHandler('otp_device_trust');
app.get('/security/otp-trust/:schoolCode', otpTrustHandler.get);
app.post('/security/otp-trust/:schoolCode', otpTrustHandler.post);

app.use('/backups', backupsRouter);

// Global error handler to avoid 500/502 crashes
// Ensures CORS headers are always present and returns safe defaults
app.use((err, req, res, _next) => {
  applyCorsHeaders(req, res);
  const status = err?.status || 500;
  const isGet = req.method === 'GET';
  // Log full stack for diagnostics
  console.error('GLOBAL_ERROR_HANDLER', {
    path: req.originalUrl,
    message: err?.message,
    stack: err?.stack
  });
  if (isGet) {
    return res.status(status).json([]);
  }
  return res.status(status).json({ ok: false, error: 'Internal error', code: 'INTERNAL_ERROR' });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 EXPRESS LISTENING ON PORT", PORT);
  console.log("CORS + OPTIONS HANDLER ACTIVE");
});

process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED_REJECTION', reason);
});

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT_EXCEPTION', err);
});
