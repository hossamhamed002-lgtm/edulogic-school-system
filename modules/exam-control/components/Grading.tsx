
import React, { useState, useEffect, useRef } from 'react';
import { Search, Lock, Users, PenTool, BookOpen, Loader2, CheckCircle2, Beaker } from 'lucide-react';
import { Student, Subject, GradesDatabase, GradeLevel, GRADE_LABELS } from '../examControl.types';

interface GradingProps {
  students: Student[];
  subjects: Subject[];
  grades: GradesDatabase;
  onUpdate: (grades: GradesDatabase) => void;
}

const Grading: React.FC<GradingProps> = ({ students, subjects, grades, onUpdate }) => {
  const [selectedTerm, setSelectedTerm] = useState<'term1' | 'term2'>('term1');
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>('p1');
  const [viewMode, setViewMode] = useState<'standard' | 'secret'>('standard');
  const [gradingMode, setGradingMode] = useState<'work' | 'exam' | 'practical'>('exam');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Auto-Save State
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<string>('');
  
  // Pending changes buffer
  const [pendingChanges, setPendingChanges] = useState<{[key: string]: number | ''}>({});
  
  const pendingChangesRef = useRef(pendingChanges);
  const saveRef = useRef<(changes: {[key: string]: number | ''}) => void>(() => {});

  useEffect(() => {
    pendingChangesRef.current = pendingChanges;
  }, [pendingChanges]);

  const getSecretForTerm = (s: Student) => {
      return selectedTerm === 'term1' ? s.secretNumberTerm1 : s.secretNumberTerm2;
  };

  const filteredStudents = students.filter(s => {
    if (s.gradeLevel !== selectedGrade) return false;
    
    const search = searchTerm.toLowerCase();
    if (viewMode === 'standard') {
        return (
            s.name.toLowerCase().includes(search) || 
            (s.seatingNumber && s.seatingNumber.toString().includes(search))
        );
    } else {
        const secret = getSecretForTerm(s);
        return (
            (secret && secret.toString().includes(search))
        );
    }
  });

  const sortedStudents = [...filteredStudents].sort((a, b) => {
      if (viewMode === 'secret') {
          const sA = getSecretForTerm(a) || 0;
          const sB = getSecretForTerm(b) || 0;
          return sA - sB;
      }
      return (a.seatingNumber || 0) - (b.seatingNumber || 0);
  });

  const relevantSubjects = subjects.filter(sub => 
      sub.gradeLevels && 
      sub.gradeLevels.includes(selectedGrade) && 
      sub.id !== 'sub_total_desc'
  );

  const getGradeValue = (studentId: string, subjectId: string): number | '' => {
    const key = `${studentId}|${subjectId}|${gradingMode}|${selectedTerm}`;
    if (pendingChanges[key] !== undefined) {
        return pendingChanges[key];
    }
    const record = grades[studentId]?.[subjectId];
    if (record) {
        const termRecord = selectedTerm === 'term1' ? record.term1 : record.term2;
        if (termRecord) {
             if (gradingMode === 'work') return termRecord.work;
             if (gradingMode === 'practical') return termRecord.practical;
             return termRecord.exam;
        }
    }
    return '';
  };

  const handleGradeChange = (studentId: string, subjectId: string, value: string) => {
    let num: number | '' = '';
    if (value.trim() === 'غ') {
        num = -1;
    } else if (value !== '') {
        num = parseFloat(value);
    }
    
    setPendingChanges(prev => ({
        ...prev,
        [`${studentId}|${subjectId}|${gradingMode}|${selectedTerm}`]: num
    }));
    setSaveStatus('idle');
  };

  const handlePaste = (e: React.ClipboardEvent, startRowIndex: number, startColIndex: number) => {
    e.preventDefault();
    const clipboardData = e.clipboardData.getData('text');
    if (!clipboardData) return;

    const rows = clipboardData.split(/\r\n|\n|\r/).filter(row => row.trim() !== '');
    const newPendingChanges = { ...pendingChanges };
    let changesCount = 0;

    rows.forEach((row, rIdx) => {
        const targetRowIndex = startRowIndex + rIdx;
        if (targetRowIndex >= sortedStudents.length) return;
        const cols = row.split('\t');
        
        cols.forEach((val, cIdx) => {
            const targetColIndex = startColIndex + cIdx;
            if (targetColIndex >= relevantSubjects.length) return;

            const student = sortedStudents[targetRowIndex];
            const subject = relevantSubjects[targetColIndex];

            let numVal: number | '' = '';
            const cleanVal = val.trim();

            if (cleanVal === 'غ' || cleanVal === 'A' || cleanVal === 'a') {
                numVal = -1;
            } else if (cleanVal !== '') {
                const parsed = parseFloat(cleanVal);
                if (!isNaN(parsed)) {
                    numVal = parsed;
                }
            }

            const key = `${student.id}|${subject.id}|${gradingMode}|${selectedTerm}`;
            newPendingChanges[key] = numVal;
            changesCount++;
        });
    });

    if (changesCount > 0) {
        setPendingChanges(newPendingChanges);
        setSaveStatus('idle');
    }
  };

  const saveChangesToDb = (changesToSave: {[key: string]: number | ''}) => {
    if (Object.keys(changesToSave).length === 0) return;
    const newGrades = JSON.parse(JSON.stringify(grades));

    Object.keys(changesToSave).forEach(key => {
        const [studentId, subjectId, mode, term] = key.split('|');
        const value = changesToSave[key];
        
        if (!newGrades[studentId]) newGrades[studentId] = {};
        if (!newGrades[studentId][subjectId]) newGrades[studentId][subjectId] = { 
            term1: { work: 0, practical: 0, exam: 0 }, 
            term2: { work: 0, practical: 0, exam: 0 } 
        };
        
        const finalVal = typeof value === 'number' ? value : 0;
        if (!newGrades[studentId][subjectId].term1) newGrades[studentId][subjectId].term1 = { work: 0, practical: 0, exam: 0 };
        if (!newGrades[studentId][subjectId].term2) newGrades[studentId][subjectId].term2 = { work: 0, practical: 0, exam: 0 };

        if (term === 'term1') {
            if (mode === 'work') newGrades[studentId][subjectId].term1.work = finalVal;
            else if (mode === 'practical') newGrades[studentId][subjectId].term1.practical = finalVal;
            else newGrades[studentId][subjectId].term1.exam = finalVal;
        } else {
            if (mode === 'work') newGrades[studentId][subjectId].term2.work = finalVal;
            else if (mode === 'practical') newGrades[studentId][subjectId].term2.practical = finalVal;
            else newGrades[studentId][subjectId].term2.exam = finalVal;
        }
    });

    onUpdate(newGrades);
    setPendingChanges({});
    setSaveStatus('saved');
    setLastSavedTime(new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }));
  };

  useEffect(() => {
    saveRef.current = saveChangesToDb;
  }, [grades, onUpdate]);

  useEffect(() => {
    if (Object.keys(pendingChanges).length === 0) return;
    setSaveStatus('saving');
    const timer = setTimeout(() => {
        saveChangesToDb(pendingChanges);
    }, 1000);
    return () => clearTimeout(timer);
  }, [pendingChanges]);

  useEffect(() => {
    return () => {
        if (Object.keys(pendingChangesRef.current).length > 0) {
            saveRef.current(pendingChangesRef.current);
        }
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number, colIndex: number) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) {
          e.preventDefault();
          const gridWidth = relevantSubjects.length; 
          const gridHeight = sortedStudents.length;
          
          let targetRow = rowIndex;
          let targetCol = colIndex;

          if (e.key === 'ArrowUp') targetRow = Math.max(0, rowIndex - 1);
          if (e.key === 'ArrowDown' || e.key === 'Enter') targetRow = Math.min(gridHeight - 1, rowIndex + 1);
          if (e.key === 'ArrowLeft') targetCol = Math.min(gridWidth - 1, colIndex + 1);
          if (e.key === 'ArrowRight') targetCol = Math.max(0, colIndex - 1);

          const inputId = `cell-${targetRow}-${targetCol}`;
          const el = document.getElementById(inputId) as HTMLInputElement;
          if (el) {
              el.focus();
              el.select();
          }
      }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.select();
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
            <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                <h2 className="text-xl font-bold text-gray-800 whitespace-nowrap">رصد الدرجات</h2>
                <select 
                    value={selectedGrade} 
                    onChange={e => setSelectedGrade(e.target.value as GradeLevel)}
                    className="bg-gray-50 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold flex-1 sm:flex-none cursor-pointer"
                >
                    {(Object.keys(GRADE_LABELS) as GradeLevel[]).map(g => (
                        <option key={g} value={g}>{GRADE_LABELS[g]}</option>
                    ))}
                </select>
                <div className="bg-gray-100 p-1 rounded-lg flex text-xs sm:text-sm">
                    <button onClick={() => setSelectedTerm('term1')} className={`px-3 py-1.5 rounded-md transition ${selectedTerm === 'term1' ? 'bg-white shadow text-blue-700 font-bold' : 'text-gray-500'}`}>الترم الأول</button>
                    <button onClick={() => setSelectedTerm('term2')} className={`px-3 py-1.5 rounded-md transition ${selectedTerm === 'term2' ? 'bg-white shadow text-blue-700 font-bold' : 'text-gray-500'}`}>الترم الثاني</button>
                </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border">
                    {saveStatus === 'saving' ? (
                        <><Loader2 size={14} className="text-blue-600 animate-spin" /><span className="text-xs text-blue-600 font-medium">جارٍ الحفظ...</span></>
                    ) : saveStatus === 'saved' ? (
                        <><CheckCircle2 size={14} className="text-emerald-500" /><span className="text-xs text-gray-400 font-medium">تم الحفظ {lastSavedTime}</span></>
                    ) : <span className="text-xs text-gray-400">جاهز للرصد</span>}
                </div>
                <div className="flex bg-gray-100 p-1 rounded-lg w-full sm:w-auto justify-center">
                    <button onClick={() => setViewMode('standard')} className={`flex-1 sm:flex-none p-2 rounded-md transition flex items-center justify-center gap-2 text-sm ${viewMode === 'standard' ? 'bg-white shadow text-gray-800' : 'text-gray-400'}`}><Users size={16} /> <span className="inline">الأسماء</span></button>
                    <button onClick={() => setViewMode('secret')} className={`flex-1 sm:flex-none p-2 rounded-md transition flex items-center justify-center gap-2 text-sm ${viewMode === 'secret' ? 'bg-white shadow text-indigo-600' : 'text-gray-400'}`}><Lock size={16} /> <span className="inline">سري</span></button>
                </div>
                <div className="relative flex-1 w-full lg:w-48">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input type="text" placeholder="بحث..." className="w-full pr-9 pl-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-blue-500" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
            </div>
        </div>
        <div className="flex items-center justify-center bg-blue-50/50 p-2 rounded-lg border border-blue-100">
             <span className="text-sm font-bold text-gray-600 ml-3">أنت ترصد الآن درجات:</span>
             <div className="flex bg-white rounded-lg shadow-sm border p-1">
                 <button onClick={() => setGradingMode('work')} className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-bold transition ${gradingMode === 'work' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}><BookOpen size={16} /> أعمال السنة</button>
                 <button onClick={() => setGradingMode('practical')} className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-bold transition ${gradingMode === 'practical' ? 'bg-teal-100 text-teal-700' : 'text-gray-500 hover:bg-gray-50'}`}><Beaker size={16} /> عملي</button>
                 <button onClick={() => setGradingMode('exam')} className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-bold transition ${gradingMode === 'exam' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-50'}`}><PenTool size={16} /> تحريري (الامتحان)</button>
             </div>
        </div>
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
         <div className="overflow-auto flex-1">
            <table className="w-full text-right border-collapse min-w-[800px]">
                <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                    <tr>
                        {viewMode === 'standard' ? (
                            <>
                                <th className="p-3 border-b text-sm font-semibold w-16 text-center text-gray-600 bg-gray-50 z-20 sticky right-0">جلوس</th>
                                <th className="p-3 border-b text-sm font-semibold text-gray-600 min-w-[200px] bg-gray-50 z-20 sticky right-16">اسم الطالب</th>
                            </>
                        ) : (
                            <th className="p-3 border-b text-sm font-semibold w-24 text-center text-indigo-700 bg-indigo-50 sticky right-0 z-20">السري ({selectedTerm === 'term1' ? 'ت1' : 'ت2'})</th>
                        )}
                        {relevantSubjects.map(sub => {
                            const max = gradingMode === 'work' ? sub.yearWork : (gradingMode === 'practical' ? sub.practicalScore : sub.examScore);
                            return (
                                <th key={sub.id} className={`p-3 border-b text-center min-w-[100px] ${max === 0 ? 'bg-gray-100 opacity-50' : ''}`}>
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="text-sm font-bold text-gray-800">{sub.name}</div>
                                        <div className={`text-[10px] px-2 py-0.5 rounded-full mt-1 font-bold ${max > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'}`}>{max > 0 ? `العظمى: ${max}` : 'لا يوجد'}</div>
                                    </div>
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {sortedStudents.map((student, rowIndex) => (
                        <tr key={student.id} className="hover:bg-blue-50/50 transition-colors group">
                            {viewMode === 'standard' ? (
                                <><td className="p-3 border-b border-l text-center font-mono font-bold text-gray-600 bg-gray-50/50 sticky right-0 z-10">{student.seatingNumber || '-'}</td><td className="p-3 border-b border-l font-medium text-gray-800 bg-gray-50/50 sticky right-16 z-10">{student.name}</td></>
                            ) : (
                                <td className="p-3 border-b border-l text-center font-mono font-bold text-indigo-700 bg-indigo-50/50 sticky right-0 z-10">{getSecretForTerm(student) || '-'}</td>
                            )}
                            {relevantSubjects.map((sub, colIndex) => {
                                const val = getGradeValue(student.id, sub.id);
                                const max = gradingMode === 'work' ? sub.yearWork : (gradingMode === 'practical' ? sub.practicalScore : sub.examScore);
                                const isError = typeof val === 'number' && val !== -1 && (val > max || val < 0);
                                const isDisabled = max === 0;
                                const isAbsent = val === -1;
                                
                                // عرض الخلية فارغة إذا كانت الدرجة صفراً
                                const displayValue = (val === -1) ? 'غ' : (val === 0 ? '' : val);

                                return (
                                    <td key={sub.id} className={`p-1 border-b text-center border-l relative ${isDisabled ? 'bg-gray-100' : ''}`}>
                                        <input 
                                          id={`cell-${rowIndex}-${colIndex}`} 
                                          type="text" 
                                          inputMode="decimal" 
                                          value={displayValue} 
                                          onChange={(e) => handleGradeChange(student.id, sub.id, e.target.value)} 
                                          onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)} 
                                          onPaste={(e) => handlePaste(e, rowIndex, colIndex)} 
                                          onFocus={handleFocus} 
                                          disabled={isDisabled} 
                                          className={`w-full h-full text-center py-2 bg-transparent focus:bg-blue-100/50 outline-none font-bold transition-all ${isError ? 'text-red-600 font-black' : (isAbsent ? 'text-red-500 font-black' : 'text-gray-800')} ${isDisabled ? 'cursor-not-allowed' : 'cursor-text'}`} 
                                          placeholder={isDisabled ? '' : '-'} 
                                          autoComplete="off" 
                                          title={isError ? `قيمة غير صحيحة! الحد الأقصى هو ${max}` : (isAbsent ? 'غائب' : `من ${max}`)} 
                                        />
                                        {isError && <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default Grading;
