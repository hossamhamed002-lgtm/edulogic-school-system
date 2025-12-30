import React, { createContext, useContext, useEffect, useState } from 'react';

type AppContextState = {
  schoolCode: string;
  academicYearId: string;
  academicYearName: string;
  ready: boolean;
  reloadSelection: () => void;
};

const AppContext = createContext<AppContextState | null>(null);

const STORAGE_KEY = 'selected_academic_year';

const getSelection = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as {
      schoolCode: string;
      academicYearId: string | number;
      academicYearName: string;
    };
  } catch {
    return null;
  }
};

export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [schoolCode, setSchoolCode] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');
  const [academicYearName, setAcademicYearName] = useState('');
  const [ready, setReady] = useState(false);

  const load = () => {
    const sel = getSelection();
    if (!sel || !sel.schoolCode || !sel.academicYearId) {
      setReady(false);
      if (window.location.pathname !== '/select-school') {
        window.location.replace('/select-school');
      }
      return;
    }
    setSchoolCode(sel.schoolCode);
    setAcademicYearId(String(sel.academicYearId));
    setAcademicYearName(sel.academicYearName || '');
    setReady(true);
  };

  useEffect(() => {
    load();
  }, []);

  if (!ready && window.location.pathname !== '/select-school') {
    return null;
  }

  return (
    <AppContext.Provider
      value={{
        schoolCode,
        academicYearId,
        academicYearName,
        ready,
        reloadSelection: load
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used within AppContextProvider');
  }
  return ctx;
};
