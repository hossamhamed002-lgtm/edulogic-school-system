import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as authLogin, logout as authLogout } from '../services/authService';

export interface User {
  id: number;
  username: string;
  role: string;
  schoolCode?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (schoolCode: string, username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }
  }, []);

  const handleLogin = async (schoolCode: string, username: string, password: string) => {
    try {
      const data = await authLogin(schoolCode, username, password);
      if (data?.token && data?.user) {
        setToken(data.token);
        setUser(data.user);
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  };

  const handleLogout = () => {
    authLogout();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        login: handleLogin,
        logout: handleLogout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
