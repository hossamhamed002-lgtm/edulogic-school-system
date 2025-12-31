export type DeviceFingerprint = string;

const FP_STORAGE_PREFIX = 'DEVICE_FP__';
const API_BASE = API_BASE_URL;

const getBrowserData = () => {
  if (typeof window === 'undefined') return 'server';
  const { navigator, screen } = window;
  const parts = [
    navigator.userAgent || '',
    navigator.platform || '',
    navigator.language || '',
    screen?.width || '',
    screen?.height || '',
    Intl.DateTimeFormat().resolvedOptions().timeZone || ''
  ];
  return parts.join('|');
};

export const getCurrentFingerprint = (): DeviceFingerprint => {
  return btoa(unescape(encodeURIComponent(getBrowserData())));
};

export const getStoredFingerprint = (schoolCode: string, userId: string) => {
  const key = `${FP_STORAGE_PREFIX}${schoolCode}__${userId}`;
  const local = localStorage.getItem(key);
  // try backend
  (async () => {
    try {
      const res = await fetch(`${API_BASE}/security/otp-trust/${encodeURIComponent(schoolCode)}`);
      if (!res.ok) return;
      const data = await res.json();
      const remote = data?.[key];
      if (remote) localStorage.setItem(key, remote);
    } catch {
      /* ignore */
    }
  })();
  return local;
};

export const rememberFingerprint = (schoolCode: string, userId: string, fingerprint: DeviceFingerprint) => {
  const key = `${FP_STORAGE_PREFIX}${schoolCode}__${userId}`;
  localStorage.setItem(key, fingerprint);
  (async () => {
    try {
      await fetch(`${API_BASE}/security/otp-trust/${encodeURIComponent(schoolCode)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: fingerprint })
      });
    } catch {
      /* ignore */
    }
  })();
};
import { API_BASE_URL } from '../src/services/api';
