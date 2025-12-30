
import { useState, useEffect, useCallback, useRef } from 'react';
import { UserRole, AccountType, AuditEntry } from './types';
import { translations } from './translations';
import { loadFromStorage, loadFromStorageKey, saveToStorage, saveToStorageKey, exportDatabase, importDatabase } from './db_engine';
import { getAcademicActions } from './slices/academicLogic';
import { getMemberActions } from './slices/memberLogic';
import { getFinanceActions } from './slices/financeLogic';
import { checkDeviceAndMaybeOtp, resendOtpForSession, verifyOtpAndTrust } from './security/authGuard';
import { getSecuritySettings } from './security/securitySettings';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:4100';

const LANG_KEY = 'EDULOGIC_LANG_V2';
const YEAR_KEY = 'EDULOGIC_WORKING_YEAR_V2';
const SCHOOL_CODE_KEY = 'EDULOGIC_ACTIVE_SCHOOL_CODE_V1';
const USER_ID_KEY = 'EDULOGIC_ACTIVE_USER_ID_V1';
const PROGRAMMER_USER_KEY = 'EDULOGIC_PROGRAMMER_USER_V1';
const PROGRAMMER_CONTEXT_KEY = 'EDULOGIC_PROGRAMMER_CONTEXT_V1';
const PROGRAMMER_CODE = 'PROGRAMMER';
const STORAGE_KEYS = {
  accounts: 'SCHOOL_ERP_ACCOUNTS',
  receipts: 'SCHOOL_ERP_RECEIPTS',
  banks: 'SCHOOL_ERP_BANKS',
  suppliers: 'SCHOOL_ERP_SUPPLIERS',
  journalEntries: 'SCHOOL_ERP_JOURNAL',
  feeStructure: 'SCHOOL_ERP_FEE_STRUCTURE'
};

const normalizeSchoolCode = (value: string) => value.trim().toUpperCase();
const defaultSchoolModules = () => SYSTEM_MODULES.filter((m) => m.id !== 'programmer').map((m) => m.id);

const STUDENT_NUM_BUDGET_REPORT = {
  Report_ID: 'STU-RPT-NUM-BUDGET',
  Title_Ar: 'ميزانية عددية للطلاب',
  Title_En: 'Student Numerical Budget',
  Allowed_Roles: [
    UserRole.ADMIN,
    UserRole.REGISTRAR,
    UserRole.ACCOUNTANT,
    UserRole.HR_MANAGER,
    UserRole.TEACHER,
    UserRole.WORKER
  ]
};

const STUDENT_FIRST_GRADE_REPORT = {
  Report_ID: 'STU-RPT-FIRST-GRADES',
  Title_Ar: 'كشف تنسيق الطلاب للصفوف الأولى',
  Title_En: 'First Grade Placement Report',
  Allowed_Roles: [
    UserRole.ADMIN,
    UserRole.REGISTRAR,
    UserRole.ACCOUNTANT,
    UserRole.HR_MANAGER,
    UserRole.TEACHER,
    UserRole.WORKER
  ]
};

const FIN_AR_SUMMARY_REPORT = {
  Report_ID: 'FIN-RPT-AR-SUMMARY',
  Title_Ar: 'تقرير إجمالي المطلوب تحصيله',
  Title_En: 'Accounts Receivable Summary',
  Allowed_Roles: [UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.REGISTRAR]
};

const EXAM_CONTROL_REPORTS = [
  {
    Report_ID: 'EXM-RPT-SHEET',
    Title_Ar: 'شيت الدرجات',
    Title_En: 'Exam Score Sheet',
    Allowed_Roles: [
      UserRole.ADMIN,
      UserRole.REGISTRAR,
      UserRole.TEACHER
    ]
  },
  {
    Report_ID: 'EXM-RPT-CERT',
    Title_Ar: 'الشهادات',
    Title_En: 'Certificates',
    Allowed_Roles: [
      UserRole.ADMIN,
      UserRole.REGISTRAR,
      UserRole.TEACHER
    ]
  },
  {
    Report_ID: 'EXM-RPT-TOP',
    Title_Ar: 'الأوائل',
    Title_En: 'Top Students',
    Allowed_Roles: [
      UserRole.ADMIN,
      UserRole.REGISTRAR,
      UserRole.TEACHER
    ]
  },
  {
    Report_ID: 'EXM-RPT-FAIL',
    Title_Ar: 'راسبون/دور ثاني',
    Title_En: 'Failure Report',
    Allowed_Roles: [
      UserRole.ADMIN,
      UserRole.REGISTRAR,
      UserRole.TEACHER
    ]
  },
  {
    Report_ID: 'EXM-RPT-STAT',
    Title_Ar: 'إحصائيات المواد',
    Title_En: 'Subject Statistics',
    Allowed_Roles: [
      UserRole.ADMIN,
      UserRole.REGISTRAR,
      UserRole.TEACHER
    ]
  },
  {
    Report_ID: 'EXM-RPT-STATEMENT',
    Title_Ar: 'بيان درجات طالب',
    Title_En: 'Student Statement',
    Allowed_Roles: [
      UserRole.ADMIN,
      UserRole.REGISTRAR,
      UserRole.TEACHER
    ]
  },
  {
    Report_ID: 'EXM-RPT-OFFICIAL',
    Title_Ar: 'مطبوعات رسمية',
    Title_En: 'Official Papers',
    Allowed_Roles: [
      UserRole.ADMIN,
      UserRole.REGISTRAR
    ]
  }
];

const ensureStudentReports = (reportConfigs: any[]) => {
  const requiredReports = [STUDENT_NUM_BUDGET_REPORT, STUDENT_FIRST_GRADE_REPORT];
  const updated = (reportConfigs || []).map((config: any) => {
    if (config.Category_ID !== 'students') return config;
    const reports = config.Available_Reports || [];
    const merged = requiredReports.reduce((acc, report) => {
      if (acc.some((item: any) => item.Report_ID === report.Report_ID)) return acc;
      return [...acc, report];
    }, reports);
    return { ...config, Available_Reports: merged };
  });
  const hasStudentsConfig = updated.some((config: any) => config.Category_ID === 'students');
  if (hasStudentsConfig) return updated;
  return [
    ...updated,
    {
      Category_ID: 'students',
      Category_Name_Ar: 'الطلاب',
      Category_Name_En: 'Students',
      Signature_Chain: [],
      Available_Reports: [...requiredReports]
    }
  ];
};

const ensureFinanceReports = (reportConfigs: any[]) => {
  const requiredReports = [FIN_AR_SUMMARY_REPORT];
  const updated = (reportConfigs || []).map((config: any) => {
    if (config.Category_ID !== 'finance') return config;
    const reports = config.Available_Reports || [];
    const merged = requiredReports.reduce((acc, report) => {
      if (acc.some((item: any) => item.Report_ID === report.Report_ID)) return acc;
      return [...acc, report];
    }, reports);
    return { ...config, Available_Reports: merged };
  });
  const hasFinanceConfig = updated.some((config: any) => config.Category_ID === 'finance');
  if (hasFinanceConfig) return updated;
  return [
    ...updated,
    {
      Category_ID: 'finance',
      Category_Name_Ar: 'المالية',
      Category_Name_En: 'Finance',
      Signature_Chain: [],
      Available_Reports: [...requiredReports]
    }
  ];
};

const ensureExamControlReports = (reportConfigs: any[]) => {
  const requiredReports = EXAM_CONTROL_REPORTS;
  const updated = (reportConfigs || []).map((config: any) => {
    if (config.Category_ID !== 'examControl') return config;
    const reports = config.Available_Reports || [];
    const merged = requiredReports.reduce((acc, report) => {
      if (acc.some((item: any) => item.Report_ID === report.Report_ID)) return acc;
      return [...acc, report];
    }, reports);
    return { ...config, Available_Reports: merged };
  });
  const hasExamConfig = updated.some((config: any) => config.Category_ID === 'examControl');
  if (hasExamConfig) return updated;
  return [
    ...updated,
    {
      Category_ID: 'examControl',
      Category_Name_Ar: 'كنترول الامتحانات',
      Category_Name_En: 'Exam Control',
      Signature_Chain: [],
      Available_Reports: [...requiredReports]
    }
  ];
};

const getItemYearId = (item: { Academic_Year_ID?: string; Year_ID?: string } | null | undefined) =>
  item?.Academic_Year_ID || item?.Year_ID || '';

const ensureAcademicYearIds = (db: any, fallbackYearId: string) => {
  const resolvedYearId = fallbackYearId || '';
  const legacyStages = db.schools?.[0]?.Stages_Available || [];
  const stagesSource = (db.stages && db.stages.length > 0) ? db.stages : legacyStages;

  const stages = (stagesSource || []).map((stage: any) => ({
    ...stage,
    Academic_Year_ID: stage.Academic_Year_ID || resolvedYearId
  }));

  const grades = (db.grades || []).map((grade: any) => ({
    ...grade,
    Academic_Year_ID: grade.Academic_Year_ID || resolvedYearId
  }));

  const classes = (db.classes || []).map((klass: any) => ({
    ...klass,
    Academic_Year_ID: klass.Academic_Year_ID || klass.Year_ID || resolvedYearId
  }));

  const classYearById = new Map(classes.map((klass: any) => [klass.Class_ID, klass.Academic_Year_ID]));

  const students = (db.students || []).map((student: any) => ({
    ...student,
    Academic_Year_ID: student.Academic_Year_ID || classYearById.get(student.Class_ID) || resolvedYearId
  }));

  const feeItems = (db.feeItems || []).map((item: any) => ({
    ...item,
    Academic_Year_ID: item.Academic_Year_ID || resolvedYearId
  }));

  const feeStructure = (db.feeStructure || []).map((structure: any) => ({
    ...structure,
    Academic_Year_ID: structure.Academic_Year_ID || structure.Year_ID || resolvedYearId
  }));

  const receipts = (db.receipts || []).map((receipt: any) => ({
    ...receipt,
    Academic_Year_ID: receipt.Academic_Year_ID || resolvedYearId
  }));

  const journalEntries = (db.journalEntries || []).map((entry: any) => ({
    ...entry,
    Academic_Year_ID: entry.Academic_Year_ID || resolvedYearId
  }));

  return {
    ...db,
    stages,
    grades,
    classes,
    students,
    feeItems,
    feeStructure,
    receipts,
    journalEntries
  };
};

export const SYSTEM_MODULES = [
  { id: 'dashboard', icon: 'LayoutDashboard', labelKey: 'moduleDashboard', descKey: 'overview' },
  { id: 'academic', icon: 'BookOpen', labelKey: 'moduleAcademic', descKey: 'structure' },
  { id: 'members', icon: 'Users', labelKey: 'moduleMembers', descKey: 'membersDesc' },
  { id: 'students', icon: 'GraduationCap', labelKey: 'moduleStudents', descKey: 'affairs' },
  { id: 'examControl', icon: 'ClipboardCheck', labelKey: 'moduleExamControl', descKey: 'examControlDesc' },
  { id: 'staff', icon: 'Briefcase', labelKey: 'staff', descKey: 'staffDesc' },
  { id: 'finance', icon: 'Wallet', labelKey: 'finance', descKey: 'accounting' },
  { id: 'communications', icon: 'MessageCircle', labelKey: 'moduleCommunications', descKey: 'communicationsDesc' },
  { id: 'stores', icon: 'Package', labelKey: 'stores', descKey: 'storesDesc' },
  { id: 'programmer', icon: 'Wand2', labelKey: 'moduleProgrammer', descKey: 'programmerDesc' },
];

export const INITIAL_STATE = {
  schools: [],
  years: [],
  jobTitles: [],
  stages: [],
  grades: [],
  classes: [],
  students: [],
  parents: [],
  employees: [],
  receipts: [],
  journalEntries: [],
  feeItems: [],
  accounts: [],
  banks: [],
  suppliers: [],
  rules: [],
  feeStructure: [],
  users: [],
  auditLogs: [],
  reportConfigs: []
};

export const useStore = () => {
  const [lang, setLang] = useState<'ar' | 'en'>(() => (localStorage.getItem(LANG_KEY) as 'ar' | 'en') || 'ar');
  const [schoolCode, setSchoolCode] = useState(() => localStorage.getItem(SCHOOL_CODE_KEY) || '');
  const [programmerContext, setProgrammerContext] = useState(() => localStorage.getItem(PROGRAMMER_CONTEXT_KEY) || '');

  const getYearKey = (code: string) => `${YEAR_KEY}__${code}`;
  const getUserKey = (code: string) => `${USER_ID_KEY}__${code}`;

  const loadDbForSchool = (code: string) => {
    const scopedCode = normalizeSchoolCode(code || 'DEFAULT');
    let base = loadFromStorage(INITIAL_STATE, scopedCode);
    if (!base?.schools?.length) {
      const legacy = loadFromStorage(INITIAL_STATE);
      const legacySchoolCode = legacy?.schools?.[0]?.School_Code
        ? normalizeSchoolCode(legacy.schools[0].School_Code)
        : '';
      // لا نرحّل بيانات مدرسة أخرى إلى نطاق جديد مختلف
      if (legacy?.schools?.length && legacySchoolCode === scopedCode) {
        base = legacy;
        saveToStorage(base, scopedCode);
      }
    }
    if (!base?.schools?.length) {
      const defaultModules = scopedCode === PROGRAMMER_CODE ? [] : defaultSchoolModules();
      base = {
        ...base,
        schools: [{
          School_ID: `SCH-${Date.now()}`,
          Name: 'مدرسة جديدة',
          Logo: '',
          Address: '',
          Subscription_Plan: '',
          School_Code: scopedCode,
          Allowed_Modules: defaultModules
        }]
      };
    } else {
      const defaultModules = scopedCode === PROGRAMMER_CODE ? [] : defaultSchoolModules();
      const currentCode = normalizeSchoolCode(base.schools[0].School_Code || '');
      const sameScope = currentCode === scopedCode;
      base = sameScope
        ? {
            ...base,
            schools: [{
              ...base.schools[0],
              School_Code: base.schools[0].School_Code || scopedCode,
              Allowed_Modules: base.schools[0].Allowed_Modules || defaultModules
            }]
          }
        : {
            ...base,
            schools: [{
              School_ID: `SCH-${Date.now()}`,
              Name: 'مدرسة جديدة',
              Logo: '',
              Address: '',
              Subscription_Plan: '',
              School_Code: scopedCode,
              Allowed_Modules: defaultModules
            }]
          };
    }

    const yearId = localStorage.getItem(getYearKey(scopedCode))
      || base.years.find((y: any) => y.Is_Active)?.Year_ID
      || base.years?.[0]?.Year_ID
      || '';

    const hydrated = {
      ...base,
      accounts: loadFromStorageKey(STORAGE_KEYS.accounts, base.accounts || [], scopedCode),
      receipts: loadFromStorageKey(STORAGE_KEYS.receipts, base.receipts || [], scopedCode),
      banks: loadFromStorageKey(STORAGE_KEYS.banks, base.banks || [], scopedCode),
      suppliers: loadFromStorageKey(STORAGE_KEYS.suppliers, base.suppliers || [], scopedCode),
      journalEntries: loadFromStorageKey(STORAGE_KEYS.journalEntries, base.journalEntries || [], scopedCode),
      feeStructure: loadFromStorageKey(STORAGE_KEYS.feeStructure, base.feeStructure || [], scopedCode)
    };

    const withReports = {
      ...hydrated,
      reportConfigs: ensureExamControlReports(ensureFinanceReports(ensureStudentReports(hydrated.reportConfigs || [])))
    };

    return {
      db: ensureAcademicYearIds(withReports, yearId),
      yearId,
      scopedCode
    };
  };

  const initialRef = useRef<{ db: any; yearId: string; scopedCode: string } | null>(null);
  if (!initialRef.current) {
    const { db, yearId, scopedCode } = loadDbForSchool(schoolCode || 'DEFAULT');
    initialRef.current = { db, yearId, scopedCode };
  }

  const [db, setDb] = useState(() => initialRef.current!.db);
  const [isSaved, setIsSaved] = useState(true);
  const [workingYearId, setWorkingYearId] = useState<string>(() => initialRef.current!.yearId);
  const [activeSchoolCode, setActiveSchoolCode] = useState(() => initialRef.current!.scopedCode);
  const [currentUser, setCurrentUser] = useState<any | null>(() => {
    const userId = localStorage.getItem(getUserKey(initialRef.current!.scopedCode));
    if (!userId) return null;
    return initialRef.current!.db.users?.find((u: any) => u.User_ID === userId) || null;
  });
  const [pendingOtp, setPendingOtp] = useState<any | null>(null);

  // ميزة الحفظ التلقائي مع مؤشر بصري
  useEffect(() => {
    setIsSaved(false);
    if (saveToStorage(db, activeSchoolCode)) setIsSaved(true);
  }, [db, activeSchoolCode]);

  useEffect(() => {
    saveToStorageKey(STORAGE_KEYS.accounts, db.accounts || [], activeSchoolCode);
    saveToStorageKey(STORAGE_KEYS.receipts, db.receipts || [], activeSchoolCode);
    saveToStorageKey(STORAGE_KEYS.banks, db.banks || [], activeSchoolCode);
    saveToStorageKey(STORAGE_KEYS.suppliers, db.suppliers || [], activeSchoolCode);
    saveToStorageKey(STORAGE_KEYS.journalEntries, db.journalEntries || [], activeSchoolCode);
    saveToStorageKey(STORAGE_KEYS.feeStructure, db.feeStructure || [], activeSchoolCode);
  }, [db.accounts, db.receipts, db.banks, db.suppliers, db.journalEntries, db.feeStructure, activeSchoolCode]);

  useEffect(() => {
    const hmr = (import.meta as ImportMeta & { hot?: { dispose: (cb: () => void) => void } }).hot;
    if (!hmr) return;
    hmr.dispose(() => {
      saveToStorage(db);
      saveToStorageKey(STORAGE_KEYS.accounts, db.accounts || []);
      saveToStorageKey(STORAGE_KEYS.receipts, db.receipts || []);
      saveToStorageKey(STORAGE_KEYS.banks, db.banks || []);
      saveToStorageKey(STORAGE_KEYS.suppliers, db.suppliers || []);
      saveToStorageKey(STORAGE_KEYS.journalEntries, db.journalEntries || []);
      saveToStorageKey(STORAGE_KEYS.feeStructure, db.feeStructure || []);
    });
  }, [db]);


  // الحفظ عند إغلاق التبويب
  useEffect(() => {
    const handleUnload = () => saveToStorage(db, activeSchoolCode);
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [db, activeSchoolCode]);

  // مزامنة بيانات الموظفين مع الباك-إند
  useEffect(() => {
    if (!activeSchoolCode) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/employees/${encodeURIComponent(activeSchoolCode)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data)) {
          setDb((prev) => ({ ...prev, employees: data }));
        }
      } catch (err) {
        console.warn('[API][WARN] employees fetch failed; using local copy.', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeSchoolCode]);

  useEffect(() => {
    if (!activeSchoolCode) return;
    (async () => {
      try {
        await fetch(`${API_BASE}/employees/${encodeURIComponent(activeSchoolCode)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(db.employees || [])
        });
      } catch (err) {
        console.warn('[API][WARN] employees persist failed.', err);
      }
    })();
  }, [db.employees, activeSchoolCode]);

  useEffect(() => {
    localStorage.setItem(LANG_KEY, lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  useEffect(() => {
    if (workingYearId) localStorage.setItem(getYearKey(activeSchoolCode), workingYearId);
  }, [workingYearId, activeSchoolCode]);

  // مزامنة الهيكل الأكاديمي (الأعوام، المراحل، الصفوف، الفصول)
  useEffect(() => {
    if (!activeSchoolCode) return;
    let cancelled = false;
    (async () => {
      try {
        const [yearsRes, stagesRes, gradesRes, classesRes] = await Promise.all([
          fetch(`${API_BASE}/academic/years/${encodeURIComponent(activeSchoolCode)}`),
          fetch(`${API_BASE}/academic/stages/${encodeURIComponent(activeSchoolCode)}`),
          fetch(`${API_BASE}/academic/grades/${encodeURIComponent(activeSchoolCode)}`),
          fetch(`${API_BASE}/academic/classes/${encodeURIComponent(activeSchoolCode)}`)
        ]);
        const [yearsData, stagesData, gradesData, classesData] = await Promise.all([
          yearsRes.ok ? yearsRes.json() : [],
          stagesRes.ok ? stagesRes.json() : [],
          gradesRes.ok ? gradesRes.json() : [],
          classesRes.ok ? classesRes.json() : []
        ]);
        if (!cancelled) {
          setDb((prev) => ({
            ...prev,
            years: Array.isArray(yearsData) ? yearsData : prev.years,
            stages: Array.isArray(stagesData) ? stagesData : prev.stages,
            grades: Array.isArray(gradesData) ? gradesData : prev.grades,
            classes: Array.isArray(classesData) ? classesData : prev.classes
          }));
        }
      } catch (err) {
        console.warn('[API][WARN] academic fetch failed; using local copy.', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeSchoolCode]);

  useEffect(() => {
    if (!activeSchoolCode) return;
    (async () => {
      try {
        await Promise.all([
          fetch(`${API_BASE}/academic/years/${encodeURIComponent(activeSchoolCode)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(db.years || [])
          }),
          fetch(`${API_BASE}/academic/stages/${encodeURIComponent(activeSchoolCode)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(db.stages || [])
          }),
          fetch(`${API_BASE}/academic/grades/${encodeURIComponent(activeSchoolCode)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(db.grades || [])
          }),
          fetch(`${API_BASE}/academic/classes/${encodeURIComponent(activeSchoolCode)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(db.classes || [])
          })
        ]);
      } catch (err) {
        console.warn('[API][WARN] academic persist failed.', err);
      }
    })();
  }, [db.years, db.stages, db.grades, db.classes, activeSchoolCode]);

  // مزامنة القيود المالية والإيصالات
  useEffect(() => {
    if (!activeSchoolCode) return;
    let cancelled = false;
    (async () => {
      try {
        const [receiptsRes, journalRes] = await Promise.all([
          fetch(`${API_BASE}/finance/receipts/${encodeURIComponent(activeSchoolCode)}`),
          fetch(`${API_BASE}/finance/journal/${encodeURIComponent(activeSchoolCode)}`)
        ]);
        const [receiptsData, journalData] = await Promise.all([
          receiptsRes.ok ? receiptsRes.json() : [],
          journalRes.ok ? journalRes.json() : []
        ]);
        if (!cancelled) {
          setDb((prev) => ({
            ...prev,
            receipts: Array.isArray(receiptsData) ? receiptsData : prev.receipts,
            journalEntries: Array.isArray(journalData) ? journalData : prev.journalEntries
          }));
        }
      } catch (err) {
        console.warn('[API][WARN] finance fetch failed; using local copy.', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeSchoolCode]);

  useEffect(() => {
    if (!activeSchoolCode) return;
    (async () => {
      try {
        await Promise.all([
          fetch(`${API_BASE}/finance/receipts/${encodeURIComponent(activeSchoolCode)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(db.receipts || [])
          }),
          fetch(`${API_BASE}/finance/journal/${encodeURIComponent(activeSchoolCode)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(db.journalEntries || [])
          })
        ]);
      } catch (err) {
        console.warn('[API][WARN] finance persist failed.', err);
      }
    })();
  }, [db.receipts, db.journalEntries, activeSchoolCode]);

  // مزامنة الحسابات البنكية/الموردين/الحسابات المالية/الرسوم
  useEffect(() => {
    if (!activeSchoolCode) return;
    let cancelled = false;
    (async () => {
      try {
        const [
          accountsRes,
          banksRes,
          suppliersRes,
          feeItemsRes,
          feeStructureRes
        ] = await Promise.all([
          fetch(`${API_BASE}/finance/accounts/${encodeURIComponent(activeSchoolCode)}`),
          fetch(`${API_BASE}/finance/banks/${encodeURIComponent(activeSchoolCode)}`),
          fetch(`${API_BASE}/finance/suppliers/${encodeURIComponent(activeSchoolCode)}`),
          fetch(`${API_BASE}/finance/fee-items/${encodeURIComponent(activeSchoolCode)}`),
          fetch(`${API_BASE}/finance/fee-structure/${encodeURIComponent(activeSchoolCode)}`)
        ]);
        const [
          accountsData,
          banksData,
          suppliersData,
          feeItemsData,
          feeStructureData
        ] = await Promise.all([
          accountsRes.ok ? accountsRes.json() : [],
          banksRes.ok ? banksRes.json() : [],
          suppliersRes.ok ? suppliersRes.json() : [],
          feeItemsRes.ok ? feeItemsRes.json() : [],
          feeStructureRes.ok ? feeStructureRes.json() : []
        ]);
        if (!cancelled) {
          setDb((prev) => ({
            ...prev,
            accounts: Array.isArray(accountsData) ? accountsData : prev.accounts,
            banks: Array.isArray(banksData) ? banksData : prev.banks,
            suppliers: Array.isArray(suppliersData) ? suppliersData : prev.suppliers,
            feeItems: Array.isArray(feeItemsData) ? feeItemsData : prev.feeItems,
            feeStructure: Array.isArray(feeStructureData) ? feeStructureData : prev.feeStructure
          }));
        }
      } catch (err) {
        console.warn('[API][WARN] finance masters fetch failed; using local copy.', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeSchoolCode]);

  useEffect(() => {
    if (!activeSchoolCode) return;
    (async () => {
      try {
        await Promise.all([
          fetch(`${API_BASE}/finance/accounts/${encodeURIComponent(activeSchoolCode)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(db.accounts || [])
          }),
          fetch(`${API_BASE}/finance/banks/${encodeURIComponent(activeSchoolCode)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(db.banks || [])
          }),
          fetch(`${API_BASE}/finance/suppliers/${encodeURIComponent(activeSchoolCode)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(db.suppliers || [])
          }),
          fetch(`${API_BASE}/finance/fee-items/${encodeURIComponent(activeSchoolCode)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(db.feeItems || [])
          }),
          fetch(`${API_BASE}/finance/fee-structure/${encodeURIComponent(activeSchoolCode)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(db.feeStructure || [])
          })
        ]);
      } catch (err) {
        console.warn('[API][WARN] finance masters persist failed.', err);
      }
    })();
  }, [db.accounts, db.banks, db.suppliers, db.feeItems, db.feeStructure, activeSchoolCode]);

  // مزامنة المستخدمين وسجلات التدقيق
  useEffect(() => {
    if (!activeSchoolCode) return;
    let cancelled = false;
    (async () => {
      try {
        const [usersRes, auditRes] = await Promise.all([
          fetch(`${API_BASE}/members/users/${encodeURIComponent(activeSchoolCode)}`),
          fetch(`${API_BASE}/audit/logs/${encodeURIComponent(activeSchoolCode)}`)
        ]);
        const [usersData, auditData] = await Promise.all([
          usersRes.ok ? usersRes.json() : [],
          auditRes.ok ? auditRes.json() : []
        ]);
        if (!cancelled) {
          setDb((prev) => ({
            ...prev,
            users: Array.isArray(usersData) ? usersData : prev.users,
            auditLogs: Array.isArray(auditData) ? auditData : prev.auditLogs
          }));
        }
      } catch (err) {
        console.warn('[API][WARN] users/audit fetch failed; using local copy.', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeSchoolCode]);

  useEffect(() => {
    if (!activeSchoolCode) return;
    (async () => {
      try {
        await Promise.all([
          fetch(`${API_BASE}/members/users/${encodeURIComponent(activeSchoolCode)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(db.users || [])
          }),
          fetch(`${API_BASE}/audit/logs/${encodeURIComponent(activeSchoolCode)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(db.auditLogs || [])
          })
        ]);
      } catch (err) {
        console.warn('[API][WARN] users/audit persist failed.', err);
      }
    })();
  }, [db.users, db.auditLogs, activeSchoolCode]);

  // مزامنة المدارس/أولياء الأمور/القواعد
  useEffect(() => {
    if (!activeSchoolCode) return;
    let cancelled = false;
    (async () => {
      try {
        const [schoolsRes, parentsRes, rulesRes] = await Promise.all([
          fetch(`${API_BASE}/schools/${encodeURIComponent(activeSchoolCode)}`),
          fetch(`${API_BASE}/members/parents/${encodeURIComponent(activeSchoolCode)}`),
          fetch(`${API_BASE}/settings/rules/${encodeURIComponent(activeSchoolCode)}`)
        ]);
        const [schoolsData, parentsData, rulesData] = await Promise.all([
          schoolsRes.ok ? schoolsRes.json() : [],
          parentsRes.ok ? parentsRes.json() : [],
          rulesRes.ok ? rulesRes.json() : []
        ]);
        if (!cancelled) {
          setDb((prev) => ({
            ...prev,
            schools: Array.isArray(schoolsData) && schoolsData.length ? schoolsData : prev.schools,
            parents: Array.isArray(parentsData) ? parentsData : prev.parents,
            rules: Array.isArray(rulesData) ? rulesData : prev.rules
          }));
        }
      } catch (err) {
        console.warn('[API][WARN] schools/parents/rules fetch failed; using local copy.', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeSchoolCode]);

  useEffect(() => {
    if (!activeSchoolCode) return;
    (async () => {
      try {
        await Promise.all([
          fetch(`${API_BASE}/schools/${encodeURIComponent(activeSchoolCode)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(db.schools || [])
          }),
          fetch(`${API_BASE}/members/parents/${encodeURIComponent(activeSchoolCode)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(db.parents || [])
          }),
          fetch(`${API_BASE}/settings/rules/${encodeURIComponent(activeSchoolCode)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(db.rules || [])
          })
        ]);
      } catch (err) {
        console.warn('[API][WARN] schools/parents/rules persist failed.', err);
      }
    })();
  }, [db.schools, db.parents, db.rules, activeSchoolCode]);

  useEffect(() => {
    const list = db.years || [];
    if (!list.length) return;
    const active = list.find((y: any) => y.Is_Active) || list[0];
    const hasWorking = workingYearId && list.some((y: any) => y.Year_ID === workingYearId);
    if (!hasWorking && active?.Year_ID) {
      setWorkingYearId(active.Year_ID);
    }
  }, [db.years, activeSchoolCode, workingYearId]);

  const t = translations[lang];
  const activeSchool = db.schools[0];
  const programmerMode = !!programmerContext && activeSchoolCode !== PROGRAMMER_CODE;
  const isProgrammer = !!currentUser && (
    currentUser.Username === 'dev_owner' || currentUser.Permissions?.includes('programmer')
  );
  const isSubscriptionExpired = (() => {
    if (!activeSchool?.Subscription_End) return false;
    const end = new Date(activeSchool.Subscription_End);
    if (Number.isNaN(end.getTime())) return false;
    const now = new Date();
    return end < new Date(now.getFullYear(), now.getMonth(), now.getDate());
  })();
  const isReadOnly = isSubscriptionExpired && !isProgrammer;
  const allowedModules = programmerMode
    ? SYSTEM_MODULES.filter((m) => m.id !== 'programmer').map((m) => m.id)
    : (activeSchool?.Allowed_Modules?.length
      ? activeSchool.Allowed_Modules
      : defaultSchoolModules());
  const availableModules = [
    ...SYSTEM_MODULES.filter((m) => m.id !== 'programmer' && allowedModules.includes(m.id)),
    ...((isProgrammer && !programmerMode) ? SYSTEM_MODULES.filter((m) => m.id === 'programmer') : [])
  ];
  const activeYear = db.years.find((y: any) => y.Year_ID === workingYearId);

  const allStages = db.stages || [];
  const allGrades = db.grades || [];
  const allClasses = db.classes || [];
  const allStudents = db.students || [];
  const allFeeItems = db.feeItems || [];
  const allFeeStructure = db.feeStructure || [];
  const allReceipts = db.receipts || [];
  const allJournalEntries = db.journalEntries || [];

  const stages = allStages.filter((stage: any) => getItemYearId(stage) === workingYearId);
  const grades = allGrades.filter((grade: any) => getItemYearId(grade) === workingYearId);
  const classes = allClasses.filter((klass: any) => getItemYearId(klass) === workingYearId);
  const students = allStudents.filter((student: any) => getItemYearId(student) === workingYearId);
  const feeItems = allFeeItems.filter((item: any) => getItemYearId(item) === workingYearId);
  const feeStructure = allFeeStructure.filter((structure: any) => getItemYearId(structure) === workingYearId);
  const receipts = allReceipts.filter((receipt: any) => getItemYearId(receipt) === workingYearId);
  const journalEntries = allJournalEntries.filter((entry: any) => getItemYearId(entry) === workingYearId);

  const logAction = (data: any) => {
    const newLog: AuditEntry = {
      Log_ID: `LOG-${Date.now()}`,
      Timestamp: new Date().toLocaleString('sv-SE').slice(0, 16),
      User_ID: currentUser?.User_ID || 'SYSTEM',
      Username: currentUser?.Username || 'SYSTEM',
      IP_Address: '127.0.0.1',
      Page_Name_En: '', Action_En: '', Details: '',
      ...data
    };
    setDb((prev: any) => ({ ...prev, auditLogs: [newLog, ...(prev.auditLogs || [])].slice(0, 500) }));
  };

  const guardedSetDb = (updater: any) => {
    if (isReadOnly) {
      alert(lang === 'ar' ? 'انتهى الاشتراك: الوضع الآن قراءة فقط.' : 'Subscription expired: read-only mode.');
      return;
    }
    setDb(updater);
  };

  const academicActions = getAcademicActions(guardedSetDb, activeSchool, logAction, () => workingYearId);
  const memberActions = getMemberActions(guardedSetDb, activeSchool, logAction, () => workingYearId);
  const financeActions = getFinanceActions(guardedSetDb, logAction, () => workingYearId);

  const switchSchool = (code: string) => {
    const { db: nextDb, yearId, scopedCode } = loadDbForSchool(code);
    setDb(nextDb);
    setWorkingYearId(yearId);
    setActiveSchoolCode(scopedCode);
    setCurrentUser(null);
  };

  const login = (code: string, username: string, password: string) => {
    const scopedCode = normalizeSchoolCode(code);
    const { db: nextDb, yearId } = loadDbForSchool(scopedCode);
    setActiveSchoolCode(scopedCode);
    localStorage.removeItem(PROGRAMMER_CONTEXT_KEY);
    setProgrammerContext('');
    setPendingOtp(null);

    const users = nextDb.users || [];
    if (users.length === 0) {
      return { ok: false, error: lang === 'ar' ? 'لا توجد مدرسة مسجلة لهذا الكود' : 'No school registered for this code' };
    }

    const user = users.find((u: any) => u.Username === username && u.Password_Hash === password && u.Is_Active !== false);
    if (user) {
      const school = (nextDb.schools || []).find(
        (s: any) => normalizeSchoolCode(s.School_Code || s.code || '') === scopedCode
      );
      const userPhone = user.Phone || school?.WhatsApp_Number || school?.Phone_Numbers;
      const guard = checkDeviceAndMaybeOtp(scopedCode, {
        ...user,
        Phone: userPhone,
        Email: user.Email || school?.Email_Address
      });
      if (!guard.trusted && guard.session) {
        setPendingOtp({
          sessionId: guard.session.id,
          user,
          db: nextDb,
          yearId,
          schoolCode: scopedCode,
          expiresAt: guard.session.expiresAt,
          fingerprint: guard.session.fingerprint,
          attemptsLeft: guard.session.attemptsLeft
        });
        return {
          ok: false,
          otpRequired: true,
          sessionId: guard.session.id,
          expiresAt: guard.session.expiresAt,
          attemptsLeft: guard.session.attemptsLeft
        };
      }
      setDb(nextDb);
      setWorkingYearId(yearId);
      setCurrentUser(user);
      localStorage.setItem(getUserKey(scopedCode), user.User_ID);
      return { ok: true };
    }

    return { ok: false, error: lang === 'ar' ? 'بيانات الدخول غير صحيحة' : 'Invalid credentials' };
  };

  const loginProgrammer = (username: string) => {
    const scopedCode = PROGRAMMER_CODE;
    const { db: nextDb, yearId } = loadDbForSchool(scopedCode);
    setDb(nextDb);
    setWorkingYearId(yearId);
    setActiveSchoolCode(scopedCode);
    localStorage.removeItem(PROGRAMMER_CONTEXT_KEY);
    setProgrammerContext('');

    const users = nextDb.users || [];
    const existing = users.find((u: any) => u.Username === username && u.Permissions?.includes('programmer'));
    let programmerUser = existing;
    if (!programmerUser) {
      programmerUser = {
        User_ID: `PRG-${Date.now()}`,
        Emp_ID: '',
        Username: username,
        Password_Hash: '',
        Role: UserRole.ADMIN,
        Is_Active: true,
        Permissions: ['programmer']
      };
      setDb((prev: any) => ({ ...prev, users: [programmerUser, ...(prev.users || [])] }));
    }
    setCurrentUser(programmerUser);
    return { ok: true };
  };

  const verifyOtpCode = async (sessionId: string, code: string) => {
    if (!pendingOtp || pendingOtp.sessionId !== sessionId) {
      return { ok: false, error: 'لا توجد جلسة تحقق متاحة' };
    }
    const result = verifyOtpAndTrust(pendingOtp.schoolCode, sessionId, code, pendingOtp.user.User_ID);
    if (!result.ok) {
      return { ok: false, error: result.error || 'الكود غير صحيح', attemptsLeft: result.attemptsLeft };
    }
    setDb(pendingOtp.db);
    setWorkingYearId(pendingOtp.yearId);
    setCurrentUser(pendingOtp.user);
    localStorage.setItem(getUserKey(pendingOtp.schoolCode), pendingOtp.user.User_ID);
    setPendingOtp(null);
    return { ok: true };
  };

  const resendOtpCode = async (sessionId: string) => {
    if (!pendingOtp || pendingOtp.sessionId !== sessionId) return { ok: false, error: 'لا توجد جلسة' };
    const school = (pendingOtp.db?.schools || []).find(
      (s: any) => normalizeSchoolCode(s.School_Code || s.code || '') === pendingOtp.schoolCode
    );
    const userPhone = pendingOtp.user?.Phone || school?.WhatsApp_Number || school?.Phone_Numbers;
    const userEmail = pendingOtp.user?.Email || school?.Email_Address;
    const refreshed = resendOtpForSession(pendingOtp.schoolCode, sessionId, userPhone, userEmail);
    if (!refreshed) return { ok: false, error: 'تعذر إعادة الإرسال' };
    setPendingOtp({ ...pendingOtp, expiresAt: refreshed.expiresAt });
    return { ok: true, expiresAt: refreshed.expiresAt };
  };

  const cancelOtp = () => setPendingOtp(null);

  const enterSchoolAsAdmin = (code: string, username: string, password: string) => {
    const scopedCode = normalizeSchoolCode(code);
    const { db: nextDb, yearId } = loadDbForSchool(scopedCode);
    const user = nextDb.users?.find((u: any) => u.Username === username && u.Password_Hash === password && u.Is_Active !== false);
    if (!user) {
      return { ok: false, error: lang === 'ar' ? 'بيانات الدخول غير صحيحة' : 'Invalid credentials' };
    }
    setDb(nextDb);
    setWorkingYearId(yearId);
    setActiveSchoolCode(scopedCode);
    setCurrentUser(user);
    localStorage.removeItem(SCHOOL_CODE_KEY);
    localStorage.setItem(PROGRAMMER_CONTEXT_KEY, scopedCode);
    setProgrammerContext(scopedCode);
    return { ok: true };
  };

  const exitProgrammerMode = () => {
    const scopedCode = PROGRAMMER_CODE;
    const { db: nextDb, yearId } = loadDbForSchool(scopedCode);
    setDb(nextDb);
    setWorkingYearId(yearId);
    setActiveSchoolCode(scopedCode);
    localStorage.removeItem(PROGRAMMER_CONTEXT_KEY);
    setProgrammerContext('');

    const programmerUserId = localStorage.getItem(PROGRAMMER_USER_KEY);
    let programmerUser = programmerUserId
      ? nextDb.users?.find((u: any) => u.User_ID === programmerUserId)
      : nextDb.users?.find((u: any) => u.Permissions?.includes('programmer'));
    if (!programmerUser) {
      programmerUser = {
        User_ID: `PRG-${Date.now()}`,
        Emp_ID: '',
        Username: 'dev_owner',
        Password_Hash: '',
        Role: UserRole.ADMIN,
        Is_Active: true,
        Permissions: ['programmer']
      };
      setDb((prev: any) => ({ ...prev, users: [programmerUser, ...(prev.users || [])] }));
      localStorage.setItem(PROGRAMMER_USER_KEY, programmerUser.User_ID);
    }
    setCurrentUser(programmerUser);
    localStorage.setItem(getUserKey(scopedCode), programmerUser.User_ID);
  };

  const logout = () => {
    localStorage.removeItem(getUserKey(activeSchoolCode));
    localStorage.removeItem(PROGRAMMER_CONTEXT_KEY);
    setProgrammerContext('');
    setCurrentUser(null);
    setPendingOtp(null);
  };

  return {
    lang, t, isSaved, toggleLang: () => setLang(prev => prev === 'ar' ? 'en' : 'ar'),
    activeSchool, activeYear, currentUser, workingYearId, setActiveYearId: setWorkingYearId,
    availableModules,
    isReadOnly,
    isProgrammer,
    programmerMode,
    schoolCode: activeSchoolCode,
    switchSchool,
    login,
    loginProgrammer,
    verifyOtpCode,
    resendOtpCode,
    cancelOtp,
    enterSchoolAsAdmin,
    exitProgrammerMode,
    logout,
    ...db,
    stages,
    grades,
    classes,
    students,
    feeItems,
    feeStructure,
    receipts,
    journalEntries,
    allStages,
    allGrades,
    allClasses,
    allStudents,
    allFeeItems,
    allFeeStructure,
    allReceipts,
    allJournalEntries,
    ...academicActions, ...memberActions, ...financeActions,
    exportData: () => exportDatabase(db),
    importData: async (file: File) => {
      try {
        const newData = await importDatabase(file);
        const yearId = localStorage.getItem(YEAR_KEY)
          || newData.years.find((y: any) => y.Is_Active)?.Year_ID
          || newData.years?.[0]?.Year_ID
          || '';
        setDb(ensureAcademicYearIds(newData, yearId));
        setWorkingYearId(yearId);
        setIsSaved(true);
        alert(lang === 'ar' ? '?? ??????? "???? ??????" ?????' : 'Vault data restored successfully');
      } catch (e) { alert(e); }
    },
    updateSchool: (data: any) => {
      if (isReadOnly) {
        alert(lang === 'ar' ? 'انتهى الاشتراك: الوضع الآن قراءة فقط.' : 'Subscription expired: read-only mode.');
        return;
      }
      setDb((prev: any) => ({ ...prev, schools: [{ ...prev.schools[0], ...data }] }));
    },
    checkIntegrity: {
      isYearUsed: (id: string) => db.classes.some((c: any) => getItemYearId(c) === id),
      isStageUsed: (id: string) => db.grades.some((g: any) => g.Stage_ID === id),
      isGradeUsed: (id: string) => db.classes.some((c: any) => c.Grade_ID === id),
      isClassUsed: (id: string) => db.students.some((s: any) => s.Class_ID === id),
      isJobUsed: (id: string) => db.employees.some((e: any) => e.Job_ID === id)
    }
  };
};
