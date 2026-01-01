import { apiPost } from './api';

export type LoginResponse = {
  token: string;
  user?: {
    id: number;
    username: string;
    role: string;
    schoolCode?: string;
  };
};

export const login = async (
  schoolCode: string,
  username: string,
  password: string
): Promise<LoginResponse | null> => {
  const data = await apiPost('/auth/login', { schoolCode, username, password });

  if (data?.token) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('auth_token', data.token);
  }

  if (data?.user) {
    localStorage.setItem('auth_user', JSON.stringify(data.user));
    localStorage.setItem('user', JSON.stringify(data.user));
  }

  if (data?.token && data?.user) {
    return data as LoginResponse;
  }

  return null;
};

export const logout = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('token');
  localStorage.removeItem('auth_user');
  localStorage.removeItem('user');
};
