export interface AuthUser {
  id: number;
  username: string;
  role: string;
  schoolCode?: string;
}

export const isLoggedIn = (): boolean => {
  return !!localStorage.getItem('auth_token');
};

export const getUser = (): AuthUser | null => {
  const raw = localStorage.getItem('auth_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
};

export const hasRole = (role: string): boolean => {
  const user = getUser();
  if (!user) return false;
  return user.role === role;
};
