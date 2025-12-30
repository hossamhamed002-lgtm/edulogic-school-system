
import React, { useState } from 'react';
// Fix: Replace non-existent CalendarAlert with AlertCircle to fix compilation error
import { Plus, Presentation, Users, Trash2, Edit3, X, Info, Search, GitCommitVertical, Lock, AlertCircle } from 'lucide-react';
import { Class } from '../../types';

interface ClassesTabProps { store: any; }

const ClassesTab: React.FC<ClassesTabProps> = ({ store }) => {
  const { t, lang, classes, addClass, updateClass, deleteClass, activeYear, grades, employees, stages, checkIntegrity } = store;
  const isRtl = lang === 'ar';
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState({ Class_Name: '', Grade_ID: '', Class_Teacher_ID: '' });

  // التحقق من صحة البيانات قبل الحفظ
  const isFormValid = form.Class_Name.trim() !== '' && form.Grade_ID !== '' && !!activeYear;

  const handleSaveClass = () => {
    if (!isFormValid) return;
    
    if (editingClassId) {
      updateClass(editingClassId, form);
    } else {
      addClass({ ...form, Year_ID: activeYear.Year_ID });
    }
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingClassId(null);
    setForm({ Class_Name: '', Grade_ID: '', Class_Teacher_ID: '' });
  };

  const openEditModal = (cls: Class) => {
    setForm({ Class_Name: cls.Class_Name, Grade_ID: cls.Grade_ID, Class_Teacher_ID: cls.Class_Teacher_ID });
    setEditingClassId(cls.Class_ID);
    setIsModalOpen(true);
  };

  const filteredClasses = classes.filter((c: Class) => 
    c.Year_ID === activeYear?.Year_ID && 
    (c.Class_Name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     c.Class_ID.toLowerCase().includes(searchTerm.toLowerCase()) ||
     grades.find(g => g.Grade_ID === c.Grade_ID)?.Grade_Name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 text-start">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="text-start">
          <h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">{t.classMgt}</h3>
          <p className="text-[10px] md:text-xs text-slate-400 font-bold mt-1 tracking-tight">
            {activeYear ? (isRtl ? `العام الحالي: ${activeYear.Year_Name}` : `Active Year: ${activeYear.Year_Name}`) : (isRtl ? '⚠️ لا يوجد عام دراسي نشط' : '⚠️ No active year')}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row w-full xl:w-auto items-center gap-4">
           <div className="w-full sm:flex-1 relative">
              <Search className={`absolute inset-y-0 ${isRtl ? 'right-4' : 'left-4'} my-auto text-slate-300`} size={18} />
              <input 
                type="text"
                placeholder={isRtl ? 'بحث في الفصول...' : 'Search classes...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full ${isRtl ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-2.5 md:py-3 bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all`}
              />
           </div>
           <button 
            onClick={() => setIsModalOpen(true)}
            disabled={(classes || []).length > 0}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl font-black text-xs md:text-sm shadow-xl active:scale-95 transition-all ${
              (classes || []).length > 0
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-slate-900 text-white hover:scale-[1.02]'
            }`}
            title={(classes || []).length > 0 ? (isRtl ? 'تم تحميل الهيكل الافتراضي - الإضافة اليدوية للفصول معطلة' : 'Default structure loaded - manual class add disabled') : ''}
           >
            <Plus size={18} />
            {t.addClass}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {filteredClasses.length === 0 ? (
          <div className="col-span-full bg-white border-2 border-dashed border-slate-100 rounded-[2.5rem] p-16 md:p-24 text-center">
             <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-50 text-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Presentation size={48} />
             </div>
             <p className="text-slate-400 font-black italic text-sm md:text-base">
               {!activeYear ? (isRtl ? 'يرجى تفعيل عام دراسي أولاً من تبويب الأعوام' : 'Please activate a year first') : (isRtl ? 'لا توجد فصول مضافة لهذا العام' : 'No classes for this year')}
             </p>
          </div>
        ) : (
          filteredClasses.map((cls: Class, idx: number) => {
            const grade = grades.find((g: any) => g.Grade_ID === cls.Grade_ID);
            const teacher = employees.find((e: any) => e.Emp_ID === cls.Class_Teacher_ID);
            const inUse = checkIntegrity.isClassUsed(cls.Class_ID);
            
            return (
              <div key={`${cls.Class_ID}-${idx}`} className="bg-white p-5 md:p-6 rounded-2xl md:rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-2xl transition-all duration-500 group flex flex-col h-full relative overflow-hidden">
                <div className="flex justify-between items-start mb-4 md:mb-6">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-900 text-white rounded-xl md:rounded-2xl flex items-center justify-center font-black text-lg md:text-xl shadow-lg group-hover:bg-indigo-600 transition-colors">
                    {cls.Class_Name.charAt(0)}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditModal(cls)} className="p-1.5 md:p-2 text-slate-300 hover:text-indigo-600 transition-colors"><Edit3 size={16} /></button>
                    {!inUse && <button onClick={() => { if(confirm(isRtl ? 'حذف؟' : 'Delete?')) deleteClass(cls.Class_ID); }} className="p-1.5 md:p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>}
                  </div>
                </div>

                <div className="space-y-2 flex-1">
                  <h4 className="text-lg md:text-xl font-black text-slate-800 truncate">{cls.Class_Name}</h4>
                  <span className="text-[9px] md:text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-md inline-block">
                     {grade?.Grade_Name || '---'}
                  </span>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-50 flex items-center gap-2 md:gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-white shadow-sm">
                    {teacher ? <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${teacher.Emp_ID}`} alt="" /> : <Users size={14} className="text-slate-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase truncate">{isRtl ? 'رائد الفصل' : 'Teacher'}</p>
                    <p className="text-[10px] md:text-xs font-bold text-slate-600 truncate">{teacher?.Name_Ar || '---'}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
           <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl p-6 md:p-8 animate-in zoom-in-95">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-xl font-black text-slate-900">{editingClassId ? t.editClass : t.addClass}</h3>
                 <button onClick={closeModal} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
              </div>

              {!activeYear && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
                  {/* Fix: Replace non-existent CalendarAlert with AlertCircle */}
                  <AlertCircle className="text-rose-500 shrink-0" size={20} />
                  <p className="text-[11px] font-bold text-rose-700 leading-tight">
                    {isRtl ? 'تنبيه: لا يوجد عام دراسي نشط حالياً. يرجى تفعيل عام دراسي من "الأعوام الدراسية" قبل إضافة الفصول.' : 'Alert: No active academic year. Please activate one from "Academic Years" first.'}
                  </p>
                </div>
              )}

              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ps-1">{t.className} *</label>
                    <input 
                      type="text" 
                      value={form.Class_Name} 
                      onChange={e => setForm({...form, Class_Name: e.target.value})} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all" 
                      placeholder="1/A" 
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ps-1">{t.grade} *</label>
                    <select 
                      value={form.Grade_ID} 
                      onChange={e => setForm({...form, Grade_ID: e.target.value})} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-500/10"
                    >
                       <option value="">{t.selectGrade}</option>
                       {grades.map((g: any) => <option key={g.Grade_ID} value={g.Grade_ID}>{g.Grade_Name}</option>)}
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ps-1">{isRtl ? 'رائد الفصل' : 'Teacher'}</label>
                    <select 
                      value={form.Class_Teacher_ID} 
                      onChange={e => setForm({...form, Class_Teacher_ID: e.target.value})} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-500/10"
                    >
                       <option value="">{isRtl ? 'اختر معلماً...' : 'Select teacher...'}</option>
                       {employees.map((e: any) => <option key={e.Emp_ID} value={e.Emp_ID}>{e.Name_Ar}</option>)}
                    </select>
                 </div>
                 <div className="flex gap-4 pt-4">
                    <button onClick={closeModal} className="flex-1 py-3 bg-slate-100 text-slate-400 font-black rounded-xl text-xs uppercase hover:bg-slate-200 transition-all">{t.cancel}</button>
                    <button 
                      onClick={handleSaveClass} 
                      disabled={!isFormValid}
                      className={`flex-1 py-3 font-black rounded-xl text-xs uppercase shadow-xl transition-all ${isFormValid ? 'bg-indigo-600 text-white shadow-indigo-600/20 hover:bg-slate-900' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                    >
                      {t.save}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ClassesTab;
