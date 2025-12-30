const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

const authHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const handleResponse = async (res: Response) => {
  if (res.status === 401) {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Request failed');
  }
  return res.json();
};

export const apiGet = async (url: string) => {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders()
    },
    credentials: 'include'
  });
  return handleResponse(res);
};

export const apiPost = async (url: string, body: any) => {
  const res = await fetch(`${API_BASE}${url}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders()
    },
    credentials: 'include',
    body: JSON.stringify(body)
  });
  return handleResponse(res);
};
