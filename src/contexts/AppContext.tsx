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
    const path = window.location.pathname;
    const isSelect = path === '/select-school';
    const isLogin = path === '/login';
    const isDev = path.startsWith('/developer');

    if (isDev) {
      setReady(true);
      return;
    }

    if (!sel || !sel.schoolCode || !sel.academicYearId) {
      if (isSelect || isLogin) {
        setReady(true);
        return;
      }
      window.location.replace('/select-school');
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

  if (
    !ready &&
    window.location.pathname !== '/select-school' &&
    window.location.pathname !== '/login' &&
    !window.location.pathname.startsWith('/developer')
  )
    return null;

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
