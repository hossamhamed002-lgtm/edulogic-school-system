import React, { useEffect, useMemo, useState } from 'react';
import { ShieldAlert, Trash2, AlertTriangle } from 'lucide-react';
import purgeData from '../../services/dataPurgeService';
import { useStore } from '../../store';
const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:4100';

type SchoolEntry = { id: string; name: string; code: string };

const DIRECTORY_KEY = 'EDULOGIC_SCHOOLS_DIRECTORY_V1';
const loadDirectory = async (): Promise<SchoolEntry[]> => {
  const res = await fetch(`${API_BASE}/backups/${encodeURIComponent('DIRECTORY')}`);
  if (res.ok) {
    const data = await res.json();
    if (Array.isArray(data)) return data;
  }
  return [];
};

const moduleOptions = [
  { id: 'students', label: 'الطلاب' },
  { id: 'parents', label: 'أولياء الأمور' },
  { id: 'attendance', label: 'الحضور والغياب' },
  { id: 'fees', label: 'الرسوم والفواتير' },
  { id: 'receipts', label: 'سندات القبض' },
  { id: 'journal', label: 'القيود اليومية' },
  { id: 'chart', label: 'دليل الحسابات (عدا النظامية)' },
  { id: 'stores', label: 'المخازن' },
  { id: 'fixedAssets', label: 'الأصول الثابتة' },
  { id: 'cheques', label: 'الشيكات' },
  { id: 'users', label: 'المستخدمين (غير المدير العام)' }
];

const DataPurgeManager: React.FC = () => {
  const store = useStore();
  const { currentUser, activeYear, years, activeSchool, schoolCode } = store as any;
  const [schools, setSchools] = useState<SchoolEntry[]>([]);
  const [scopeSchool, setScopeSchool] = useState<'all' | 'one'>('one');
  const [selectedSchoolCode, setSelectedSchoolCode] = useState('');
  const [scopeYear, setScopeYear] = useState<'all' | 'one'>('all');
  const [selectedYearId, setSelectedYearId] = useState('');
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [mode, setMode] = useState<'demo' | 'all'>('demo');
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [resultMessage, setResultMessage] = useState('');

  const defaultSchool: SchoolEntry | null = useMemo(() => {
    const code =
      (schoolCode as string) ||
      activeSchool?.School_Code ||
      activeSchool?.Code ||
      activeSchool?.ID ||
      'SCHOOL';
    const name = activeSchool?.Name || 'المدرسة الافتراضية';
    if (!code) return null;
    return { id: code, code, name };
  }, [schoolCode, activeSchool]);

  useEffect(() => {
    (async () => {
      const dir = await loadDirectory();
      let list = dir;
      if (!dir.length && defaultSchool) {
        list = [defaultSchool];
      } else if (defaultSchool && !dir.some((s) => s.code === defaultSchool.code)) {
        list = [defaultSchool, ...dir];
      }
      setSchools(list);
      if (!selectedSchoolCode && list.length) {
        setSelectedSchoolCode(list[0].code);
      }
    })();
  }, [defaultSchool, selectedSchoolCode]);

  useEffect(() => {
    if (activeYear?.Year_ID) setSelectedYearId(activeYear.Year_ID);
  }, [activeYear]);

  const allYears = years || [];

  const canSubmit = useMemo(() => {
    const hasSchool = scopeSchool === 'all' ? true : Boolean(selectedSchoolCode);
    const hasYear = scopeYear === 'all' ? true : Boolean(selectedYearId);
    const hasModules = selectedModules.length > 0;
    const confirmOk = confirmText === 'DELETE';
    const passwordOk = currentUser?.Password_Hash
      ? Boolean(password) && currentUser.Password_Hash === password
      : true;
    return hasSchool && hasYear && hasModules && confirmOk && passwordOk;
  }, [scopeSchool, selectedSchoolCode, scopeYear, selectedYearId, selectedModules, confirmText, password, currentUser]);

  const toggleModule = (id: string) => {
    setSelectedModules((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));
  };

  const selectAllModules = () => setSelectedModules(moduleOptions.map((m) => m.id));
  const clearModules = () => setSelectedModules([]);

  const handleExecute = () => {
    if (!canSubmit) return;
    setShowConfirm(true);
  };

  const handleConfirmExecute = () => {
    if (!canSubmit) return;
    const targetSchools =
      scopeSchool === 'all'
        ? schools.length ? schools : defaultSchool ? [defaultSchool] : []
        : schools.filter((s) => s.code === selectedSchoolCode);
    if (!targetSchools.length && defaultSchool) {
      targetSchools.push(defaultSchool);
    }
    const payload = {
      schools: targetSchools,
      yearId: scopeYear === 'all' ? null : selectedYearId,
      modules: selectedModules as any,
      mode,
      currentUserId: currentUser?.User_ID || '',
      currentUsername: currentUser?.Username || ''
    };
    const res = purgeData(payload);
    setResultMessage(`تم التنفيذ. المدارس المتأثرة: ${res.length}`);
    setShowConfirm(false);
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-start gap-3">
        <ShieldAlert className="text-rose-500 mt-1" />
        <div>
          <h2 className="text-2xl font-black text-slate-900">⚠️ إدارة حذف البيانات</h2>
          <p className="text-sm font-bold text-rose-500">
            هذه العمليات غير قابلة للتراجع إلا من خلال النسخ الاحتياطية
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
        <h3 className="text-lg font-black text-slate-800">إعداد نطاق الحذف</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-bold text-slate-700">اختيار المدارس</p>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input
                  type="radio"
                  name="school-scope"
                  value="all"
                  checked={scopeSchool === 'all'}
                  onChange={() => setScopeSchool('all')}
                  className="accent-blue-600"
                />
                كل المدارس
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input
                  type="radio"
                  name="school-scope"
                  value="one"
                  checked={scopeSchool === 'one'}
                  onChange={() => setScopeSchool('one')}
                  className="accent-blue-600"
                />
                مدرسة محددة
              </label>
              {scopeSchool === 'one' && (
                <select
                  value={selectedSchoolCode}
                  onChange={(e) => setSelectedSchoolCode(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                >
                  <option value="">اختر المدرسة...</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.code}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-bold text-slate-700">اختيار الأعوام</p>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input
                  type="radio"
                  name="year-scope"
                  value="all"
                  checked={scopeYear === 'all'}
                  onChange={() => setScopeYear('all')}
                  className="accent-blue-600"
                />
                كل الأعوام
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input
                  type="radio"
                  name="year-scope"
                  value="one"
                  checked={scopeYear === 'one'}
                  onChange={() => setScopeYear('one')}
                  className="accent-blue-600"
                />
                عام دراسي محدد
              </label>
              {scopeYear === 'one' && (
                <select
                  value={selectedYearId}
                  onChange={(e) => setSelectedYearId(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                >
                  <option value="">اختر العام...</option>
                  {allYears.map((y: any) => (
                    <option key={y.Year_ID} value={y.Year_ID}>
                      {y.Year_Name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-800">اختيار نوع الحذف</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={selectAllModules}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
            >
              تحديد الكل
            </button>
            <button
              type="button"
              onClick={clearModules}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
            >
              إلغاء الكل
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {moduleOptions.map((mod) => (
            <label
              key={mod.id}
              className={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold ${
                selectedModules.includes(mod.id)
                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-white text-slate-700'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedModules.includes(mod.id)}
                onChange={() => toggleModule(mod.id)}
                className="accent-blue-600"
              />
              {mod.label}
            </label>
          ))}
        </div>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <input
              type="radio"
              name="mode"
              value="demo"
              checked={mode === 'demo'}
              onChange={() => setMode('demo')}
              className="accent-blue-600"
            />
            حذف البيانات الوهمية فقط
          </label>
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <input
              type="radio"
              name="mode"
              value="all"
              checked={mode === 'all'}
              onChange={() => setMode('all')}
              className="accent-blue-600"
            />
            حذف كل البيانات المدخلة يدويًا
          </label>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm space-y-3">
        <h3 className="text-lg font-black text-slate-800">الأمان</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500">اكتب كلمة DELETE للتأكيد</label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500">كلمة مرور المستخدم الحالي</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm text-amber-600 font-semibold">
          <AlertTriangle size={16} />
          سيتم حذف البيانات المحددة فقط ضمن النطاق المختار. لا تراجع إلا عبر النسخ الاحتياطية.
        </div>
        <div className="flex items-center justify-end">
          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleExecute}
            className={`flex items-center gap-2 rounded-2xl border px-5 py-2 text-sm font-bold shadow-sm ${
              canSubmit
                ? 'border-rose-200 bg-rose-50 text-rose-700 hover:shadow'
                : 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
            }`}
          >
            <Trash2 size={16} /> تنفيذ الحذف
          </button>
        </div>
        {resultMessage && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
            {resultMessage}
          </div>
        )}
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setShowConfirm(false)}
            className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px]"
          />
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl" dir="rtl">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="text-amber-500" />
              <div>
                <h4 className="text-lg font-black text-slate-800">تأكيد الحذف</h4>
                <p className="text-xs font-semibold text-slate-500">
                  سيتم حذف البيانات المحددة ضمن النطاق الحالي. لا يمكن التراجع إلا عبر النسخ الاحتياطية.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmExecute}
                className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-2 text-sm font-bold text-rose-700 shadow-sm"
              >
                🧨 تنفيذ الحذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataPurgeManager;
