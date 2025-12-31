import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Database, Settings2, Clock4 } from 'lucide-react';

const cards = [
  { to: '/developer/backups', label: 'النسخ الاحتياطي', icon: Database, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { to: '/developer/security', label: 'إعدادات الأمان', icon: Settings2, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { to: '/developer/alerts', label: 'التنبيهات الأمنية', icon: ShieldAlert, color: 'text-rose-600', bg: 'bg-rose-50' },
  { to: '/developer/audit', label: 'سجل الأحداث', icon: Clock4, color: 'text-slate-600', bg: 'bg-slate-100' }
];

const DeveloperDashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900">لوحة المبرمج</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">اختر إحدى الأدوات التقنية المتاحة.</p>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
        {cards.map((card) => (
          <button
            key={card.to}
            onClick={() => navigate(card.to)}
            className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 p-5 text-start"
          >
            <div className={`w-12 h-12 ${card.bg} ${card.color} rounded-xl flex items-center justify-center mb-4`}>
              <card.icon size={22} />
            </div>
            <div className="text-lg font-bold text-slate-900 mb-1">{card.label}</div>
            <div className="text-xs font-semibold text-slate-500">اضغط للدخول</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DeveloperDashboard;
