import React, { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../services/api';

interface AcademicYear {
  id?: number;
  name?: string;
  Academic_Year_ID?: string;
  Year_ID?: string;
  Academic_Year_Name?: string;
  academicYear?: string;
}

const SelectSchool: React.FC = () => {
  const [schoolCode, setSchoolCode] = useState(() => {
    const user = localStorage.getItem('auth_user');
    if (user) {
      try {
        const parsed = JSON.parse(user);
        if (parsed.schoolCode) return parsed.schoolCode;
      } catch {
        /* ignore */
      }
    }
    const saved = localStorage.getItem('selected_school');
    return saved || '';
  });
  const [schoolName, setSchoolName] = useState('');
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadSchool = async (code: string) => {
    if (!code) return;
    try {
      setError('');
      const data = await apiGet(`/schools/${encodeURIComponent(code)}`);
      setSchoolName(data?.Name || data?.name || '');
    } catch {
      setSchoolName('');
      setError('تعذر تحميل بيانات المدرسة');
    }
  };

  const loadYears = async (code: string) => {
    if (!code) return;
    try {
      setError('');
      const data = await apiGet(`/academic/years/${encodeURIComponent(code)}`);
      setYears(Array.isArray(data) ? data : []);
    } catch {
      setYears([]);
      setError('تعذر تحميل الأعوام الدراسية');
    }
  };

  useEffect(() => {
    if (schoolCode) {
      loadSchool(schoolCode);
      loadYears(schoolCode);
    }
  }, [schoolCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolCode || !selectedYear) {
      setError('يرجى اختيار المدرسة والعام الدراسي');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const yearObj = years.find(
        (y) =>
          y.id?.toString() === selectedYear ||
          y.Academic_Year_ID === selectedYear ||
          y.Year_ID === selectedYear
      );
      localStorage.setItem('selected_school', schoolCode);
      localStorage.setItem(
        'selected_academic_year',
        JSON.stringify({
          schoolCode,
          academicYearId:
            yearObj?.id ||
            yearObj?.Academic_Year_ID ||
            yearObj?.Year_ID ||
            selectedYear,
          academicYearName:
            yearObj?.name ||
            yearObj?.Academic_Year_Name ||
            yearObj?.academicYear ||
            selectedYear
        })
      );
      window.location.href = '/';
    } catch {
      setError('تعذر الحفظ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md space-y-4"
      >
        <h1 className="text-xl font-bold text-center">اختيار المدرسة والعام الدراسي</h1>
        {error && <div className="text-red-600 text-sm font-bold">{error}</div>}
        <div>
          <label className="block text-sm font-medium mb-1">كود المدرسة</label>
          <input
            value={schoolCode}
            onChange={(e) => setSchoolCode(e.target.value.trim())}
            className="w-full border rounded px-3 py-2"
            placeholder="مثال: SCHOOL1"
          />
          {schoolName && (
            <div className="text-xs text-gray-500 mt-1">الاسم: {schoolName}</div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">العام الدراسي</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">اختر العام</option>
            {years.map((y) => {
              const id =
                y.id?.toString() ||
                y.Academic_Year_ID ||
                y.Year_ID ||
                y.academicYear ||
                '';
              const name =
                y.name ||
                y.Academic_Year_Name ||
                y.academicYear ||
                id;
              return (
                <option key={id} value={id}>
                  {name}
                </option>
              );
            })}
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 rounded font-bold hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? 'جاري الحفظ...' : 'تأكيد'}
        </button>
      </form>
    </div>
  );
};

export default SelectSchool;
