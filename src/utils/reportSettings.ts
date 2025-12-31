import { API_BASE_URL } from '../services/api';
const API_BASE = API_BASE_URL;
type SettingsMap = Record<string, any>;
let cached: SettingsMap = {};

export const getReportSettings = (schoolCode: string): any => {
  // fire and forget refresh from API
  (async () => {
    try {
      const res = await fetch(`${API_BASE}/reports/settings/${encodeURIComponent(schoolCode || 'DEFAULT')}`);
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === 'object') {
          cached = data;
          if (typeof window !== 'undefined') {
            // no-op: cache only in memory
          }
        }
      }
    } catch {
      /* ignore */
    }
  })();
  return cached;
};

export const saveReportSettings = (schoolCode: string, settings: SettingsMap) => {
  cached = settings || {};
  (async () => {
    try {
      await fetch(`${API_BASE}/reports/settings/${encodeURIComponent(schoolCode || 'DEFAULT')}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cached)
      });
    } catch {
      /* ignore */
    }
  })();
};
