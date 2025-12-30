import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { buildDailyAttendanceRecord } from '../../src/hr/attendance/attendanceEngine';
import { AttendanceRecord, AttendanceStatus } from '../../src/hr/attendance/attendance.types';
import { LeaveRecord } from '../../src/hr/leave/leaveRecord.types';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:4100';
const ENDPOINT_ATTENDANCE = '/hr/attendance';

interface AttendanceScreenProps {
  store: any;
  onBack: () => void;
}

const buildKey = (employeeId: string, date: string) => `${employeeId}::${date}`;
const ATTENDANCE_STORAGE_KEY = 'hr_attendance_records_v1';

const getDatesBetween = (start: string, end: string) => {
  if (!start || !end) return [] as string[];
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return [];
  if (endDate < startDate) return [];
  const dates: string[] = [];
  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
};

const statusStyles: Record<AttendanceStatus, string> = {
  Present: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  Late: 'text-amber-600 bg-amber-50 border-amber-100',
  Absent: 'text-rose-600 bg-rose-50 border-rose-100',
  OnLeave: 'text-blue-600 bg-blue-50 border-blue-100',
  Holiday: 'text-slate-500 bg-slate-100 border-slate-200'
};

const AttendanceScreen: React.FC<AttendanceScreenProps> = ({ store, onBack }) => {
  const { lang, employees = [] } = store;
  const isRtl = lang === 'ar';
  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [records, setRecords] = useState<Record<string, AttendanceRecord>>({});

  useEffect(() => {
    if (!store?.schoolCode) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}${ENDPOINT_ATTENDANCE}/${encodeURIComponent(store.schoolCode)}`);
        const data = res.ok ? await res.json() : {};
        if (!cancelled && data && typeof data === 'object') {
          setRecords(data);
        }
      } catch {
        // ignore and keep empty
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [store?.schoolCode]);

  useEffect(() => {
    if (!store?.schoolCode) return;
    (async () => {
      try {
        await fetch(`${API_BASE}${ENDPOINT_ATTENDANCE}/${encodeURIComponent(store.schoolCode)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(records || {})
        });
      } catch {
        /* ignore */
      }
    })();
  }, [records, store?.schoolCode]);

  const leaveRecords = useMemo<LeaveRecord[]>(() => {
    return (store.leaveRecords || store.leaveRequests || []) as LeaveRecord[];
  }, [store.leaveRecords, store.leaveRequests]);

  const dates = useMemo(() => getDatesBetween(startDate, endDate), [startDate, endDate]);

  const getRecord = useCallback((employeeId: string, date: string) => {
    const key = buildKey(employeeId, date);
    const existing = records[key];
    if (existing) return existing;
    return buildDailyAttendanceRecord({
      employeeId,
      date,
      checkInTime: null,
      checkOutTime: null,
      notes: '',
      leaveRecords
    });
  }, [leaveRecords, records]);

  const updateRecord = useCallback((employeeId: string, date: string, patch: Partial<AttendanceRecord>) => {
    const key = buildKey(employeeId, date);
    const current = records[key] || buildDailyAttendanceRecord({
      employeeId,
      date,
      checkInTime: null,
      checkOutTime: null,
      notes: '',
      leaveRecords
    });

    const next = buildDailyAttendanceRecord({
      employeeId,
      date,
      checkInTime: patch.checkInTime ?? current.checkInTime,
      checkOutTime: patch.checkOutTime ?? current.checkOutTime,
      notes: patch.notes ?? current.notes,
      leaveRecords
    });

    setRecords((prev) => ({ ...prev, [key]: next }));
  }, [leaveRecords, records]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-start">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all">
            <ChevronLeft size={20} className={isRtl ? 'rotate-180' : ''} />
          </button>
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">{isRtl ? 'الحضور والانصراف' : 'Attendance & Departure'}</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{isRtl ? 'تسجيل يومي للموظفين' : 'Daily employee attendance'}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-bold text-slate-500">
            {isRtl ? 'من تاريخ' : 'From'}
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.currentTarget.value)}
              className="block bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 mt-1"
            />
          </label>
          <label className="text-xs font-bold text-slate-500">
            {isRtl ? 'إلى تاريخ' : 'To'}
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.currentTarget.value)}
              className="block bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 mt-1"
            />
          </label>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-4 py-4 font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'الموظف' : 'Employee'}</th>
                <th className="px-4 py-4 font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'التاريخ' : 'Date'}</th>
                <th className="px-4 py-4 font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'دخول' : 'Check-In'}</th>
                <th className="px-4 py-4 font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'خروج' : 'Check-Out'}</th>
                <th className="px-4 py-4 font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'الحالة' : 'Status'}</th>
                <th className="px-4 py-4 font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'تأخير (دقيقة)' : 'Late (min)'}</th>
                <th className="px-4 py-4 font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'انصراف مبكر' : 'Early Leave'}</th>
                <th className="px-4 py-4 font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'ملاحظات' : 'Notes'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.flatMap((employee: any) => (
                dates.map((date) => {
                  const record = getRecord(employee.Emp_ID, date);
                  const isOnLeave = record.status === 'OnLeave';

                  return (
                    <tr key={buildKey(employee.Emp_ID, date)} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-700">{employee.Name_Ar}</td>
                      <td className="px-4 py-3 text-slate-600">{date}</td>
                      <td className="px-4 py-3">
                        <input
                          type="time"
                          value={record.checkInTime || ''}
                          onChange={(event) => updateRecord(employee.Emp_ID, date, { checkInTime: event.currentTarget.value })}
                          disabled={isOnLeave}
                          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="time"
                          value={record.checkOutTime || ''}
                          onChange={(event) => updateRecord(employee.Emp_ID, date, { checkOutTime: event.currentTarget.value })}
                          disabled={isOnLeave}
                          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 text-[10px] font-black rounded-lg border ${statusStyles[record.status]}`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{record.lateMinutes}</td>
                      <td className="px-4 py-3 text-slate-600">{record.earlyLeaveMinutes}</td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={record.notes || ''}
                          onChange={(event) => updateRecord(employee.Emp_ID, date, { notes: event.currentTarget.value })}
                          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold w-full"
                        />
                      </td>
                    </tr>
                  );
                })
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceScreen;
