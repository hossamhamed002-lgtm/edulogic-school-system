import { useEffect, useState } from 'react';
import { DEFAULT_PRINT_PROFILE, PrintProfile } from './printProfile';
import { getReportSettings, saveReportSettings } from '../../src/utils/reportSettings';

export const usePrintProfile = () => {
  const storeCtx = (typeof window !== 'undefined' && (window as any).store) || null;
  const schoolCode =
    (storeCtx?.activeSchool?.School_Code ||
      storeCtx?.activeSchool?.Code ||
      storeCtx?.activeSchool?.ID ||
      storeCtx?.activeSchool?.id ||
      'DEFAULT').toString();

  const [profile, setProfile] = useState<PrintProfile>(() => {
    const all = getReportSettings(schoolCode);
    const fromRemote = (all && all['PRINT_PROFILE__FINANCE']) || {};
    return { ...DEFAULT_PRINT_PROFILE, ...fromRemote };
  });

  useEffect(() => {
    const all = getReportSettings(schoolCode);
    const next = { ...(all || {}), ['PRINT_PROFILE__FINANCE']: profile };
    saveReportSettings(schoolCode, next);
  }, [profile, schoolCode]);

  const resetProfile = () => setProfile(DEFAULT_PRINT_PROFILE);

  return { profile, setProfile, resetProfile };
};
