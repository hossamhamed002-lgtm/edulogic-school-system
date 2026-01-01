// يسمح بتحديد عنوان الباك اند من .env.local (VITE_API_BASE_URL)، مع افتراضي على نسخة Render
export const API_BASE_URL =
  import.meta.env?.VITE_API_BASE_URL || 'https://schoolpaypro.onrender.com';
const API_BASE = API_BASE_URL;

type RequestConfig = {
  method: 'GET' | 'POST';
  headers: Record<string, string>;
  body?: string;
  url?: string;
};

const isAuthFree = (url?: string) =>
  url?.startsWith('/auth/login');

const requestInterceptors: Array<(config: RequestConfig & { url?: string }) => RequestConfig> = [
  (config) => {
    const userToken = localStorage.getItem('token') || localStorage.getItem('auth_token');
    const isLogin = isAuthFree(config.url);
    const isOptions = config.method === 'OPTIONS';

    // لا نضيف الهيدر في حالة عدم وجود توكن، أو طلبات الدخول، أو OPTIONS
    if (!userToken || isLogin || isOptions) {
      return { ...config, headers: { ...config.headers } };
    }

    return {
      ...config,
      headers: {
        ...config.headers,
        Authorization: `Bearer ${userToken}`
      }
    };
  }
];

const applyInterceptors = (config: RequestConfig) =>
  requestInterceptors.reduce((acc, fn) => fn(acc), config);

const handleResponse = async (res: Response) => {
  if (res.status === 401) {
    const hasUserToken =
      !!localStorage.getItem('token') ||
      !!localStorage.getItem('auth_token');
    if (hasUserToken) {
      localStorage.removeItem('token');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Request failed');
  }
  return res.json();
};

export const apiGet = async (url: string) => {
  const hasToken =
    !!localStorage.getItem('token') ||
    !!localStorage.getItem('auth_token');
  if (!hasToken && !isAuthFree(url)) {
    throw new Error('No auth token');
  }
  const baseConfig: RequestConfig = {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    url
  };
  const config = applyInterceptors(baseConfig);
  const res = await fetch(`${API_BASE}${url}`, {
    ...config
  });
  return handleResponse(res);
};

export const apiPost = async (url: string, body: any) => {
  const hasToken =
    !!localStorage.getItem('token') ||
    !!localStorage.getItem('auth_token');
  if (!hasToken && !isAuthFree(url)) {
    throw new Error('No auth token');
  }
  const baseConfig: RequestConfig = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    url
  };
  const config = applyInterceptors(baseConfig);
  const res = await fetch(`${API_BASE}${url}`, {
    ...config
  });
  return handleResponse(res);
};
