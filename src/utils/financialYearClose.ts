export type FinancialCloseState = {
  isClosed: boolean;
  closeDate?: string;
  summary?: Record<string, any>;
};

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:4100';

const normalize = (value?: string | number | null) => {
  if (value === undefined || value === null) return '';
  return String(value).trim();
};

export const financialCloseStorageKey = (schoolId?: string | number, academicYearId?: string | number) => {
  const school = normalize(schoolId) || 'SCHOOL';
  const year = normalize(academicYearId) || 'YEAR';
  return `FINANCIAL_YEAR_CLOSE__${school}__${year}`;
};

export const fetchFinancialCloseState = async (schoolId?: string | number, academicYearId?: string | number): Promise<FinancialCloseState | null> => {
  if (typeof window === 'undefined') return null;
  const school = normalize(schoolId) || 'SCHOOL';
  const year = normalize(academicYearId) || 'YEAR';
  try {
    const res = await fetch(`${API_BASE}/finance/close-flags/${encodeURIComponent(school)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object') {
        // توقع صيغة { [key]: state }
        const state = data[financialCloseStorageKey(school, year)] as FinancialCloseState;
        if (state) {
          window.localStorage.setItem(financialCloseStorageKey(school, year), JSON.stringify(state));
          if (state.isClosed) window.localStorage.setItem(`FINANCIAL_YEAR_LOCKED__${school}__${year}`, 'true');
          return state;
        }
      }
    }
  } catch {
    /* ignore */
  }
  return null;
};

// فحص سريع (متوافق مع النسخة القديمة) هل العام مغلق أم لا
export const isFinancialYearClosed = (schoolId?: string | number, academicYearId?: string | number): boolean => {
  if (typeof window === 'undefined') return false;
  const school = normalize(schoolId) || 'SCHOOL';
  const year = normalize(academicYearId) || 'YEAR';
  const key = financialCloseStorageKey(school, year);

  // أولوية لعلامة الغلق إن وُجدت
  const locked = window.localStorage.getItem(`FINANCIAL_YEAR_LOCKED__${school}__${year}`);
  if (locked === 'true') return true;

  // قراءة حالة الغلق المخزنة
  const raw = window.localStorage.getItem(key);
  if (raw) {
    try {
      const state = JSON.parse(raw) as FinancialCloseState;
      return !!state?.isClosed;
    } catch {
      return false;
    }
  }
  return false;
};

export const persistFinancialCloseState = async (state: FinancialCloseState, schoolId?: string | number, academicYearId?: string | number) => {
  if (typeof window === 'undefined') return;
  const school = normalize(schoolId) || 'SCHOOL';
  const year = normalize(academicYearId) || 'YEAR';
  const key = financialCloseStorageKey(school, year);
  try {
    await fetch(`${API_BASE}/finance/close-flags/${encodeURIComponent(school)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: state })
    });
  } catch {
    /* ignore */
  }
};
