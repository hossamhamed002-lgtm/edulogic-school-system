const API_BASE = import.meta.env.VITE_API_URL || '';

type RequestConfig = {
  method: 'GET' | 'POST';
  headers: Record<string, string>;
  body?: string;
};

const requestInterceptors: Array<(config: RequestConfig) => RequestConfig> = [
  (config) => {
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No auth token');
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
    const hasToken =
      !!localStorage.getItem('token') ||
      !!localStorage.getItem('auth_token');
    if (hasToken) {
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
    headers: { 'Content-Type': 'application/json' }
  };
  const config = applyInterceptors(baseConfig);
  const res = await fetch(`${API_BASE}${url}`, {
    ...config,
    credentials: 'include'
  });
  return handleResponse(res);
};

export const apiPost = async (url: string, body: any) => {
  const baseConfig: RequestConfig = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  };
  const config = applyInterceptors(baseConfig);
  const res = await fetch(`${API_BASE}${url}`, {
    ...config,
    credentials: 'include'
  });
  return handleResponse(res);
};
