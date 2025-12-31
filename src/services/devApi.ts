export const DEV_API_BASE_URL = 'https://schoolpaypro.onrender.com';
const API_BASE = DEV_API_BASE_URL;

type RequestConfig = {
  method: 'GET' | 'POST';
  headers: Record<string, string>;
  body?: string;
  url?: string;
};

const isAuthFree = (url?: string) => url?.startsWith('/dev/login');

const requestInterceptors: Array<(config: RequestConfig & { url?: string }) => RequestConfig> = [
  (config) => {
    const token = localStorage.getItem('dev_token');
    const isLogin = isAuthFree(config.url);
    const isOptions = config.method === 'OPTIONS';

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
    const hasToken = !!localStorage.getItem('dev_token');
    if (hasToken) {
      localStorage.removeItem('dev_token');
      localStorage.removeItem('dev_role');
      window.location.href = '/developer/login';
    }
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Request failed');
  }
  return res.json();
};

export const devApiGet = async (url: string) => {
  const hasToken = !!localStorage.getItem('dev_token');
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

export const devApiPost = async (url: string, body: any) => {
  const hasToken = !!localStorage.getItem('dev_token');
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
