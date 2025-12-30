export const API_BASE_URL = 'https://school-pay-pro.onrender.com';
const API_BASE = API_BASE_URL;

type RequestConfig = {
  method: 'GET' | 'POST';
  headers: Record<string, string>;
  body?: string;
};

const requestInterceptors: Array<(config: RequestConfig & { url?: string }) => RequestConfig> = [
  (config) => {
    const devToken = localStorage.getItem('dev_token');
    const userToken = localStorage.getItem('token') || localStorage.getItem('auth_token');
    const token = devToken || userToken;
    const isLogin =
      config.url?.startsWith('/auth/login') ||
      config.url?.startsWith('/dev/login');
    const isOptions = config.method === 'OPTIONS';

    // لا نضيف الهيدر في حالة عدم وجود توكن، أو طلبات الدخول، أو OPTIONS
    if (!token || isLogin || isOptions) {
      return { ...config, headers: { ...config.headers } };
    }

    return {
      ...config,
      headers: {
        ...config.headers,
        Authorization: `Bearer ${token}`
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
    const hasDevToken = !!localStorage.getItem('dev_token');
    if (hasDevToken) {
      localStorage.removeItem('dev_token');
      window.location.href = '/dev/login';
    } else if (hasUserToken) {
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
