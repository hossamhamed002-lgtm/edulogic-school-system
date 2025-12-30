import { apiPost } from './api';

export const login = async (schoolCode: string, username: string, password: string) => {
  const data = await apiPost('/auth/login', { schoolCode, username, password });
  if (data?.token) {
    localStorage.setItem('auth_token', data.token);
    if (data.user) {
      localStorage.setItem('auth_user', JSON.stringify(data.user));
    }
  }
  return data;
};

export const logout = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
};
