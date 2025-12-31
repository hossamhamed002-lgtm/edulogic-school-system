import React from 'react';
import { Navigate } from 'react-router-dom';

const decodePayload = (token: string): { role?: string; scope?: string } | null => {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return {
      role: (decoded.role || '').toUpperCase(),
      scope: (decoded.scope || '').toUpperCase()
    };
  } catch {
    return null;
  }
};

type DevGuardProps = {
  children: React.ReactElement;
};

const DevAuthGuard: React.FC<DevGuardProps> = ({ children }) => {
  const token = localStorage.getItem('auth_token') || '';
  if (!token) return <Navigate to="/dev/login" replace />;
  const payload = decodePayload(token);
  if (!payload || payload.role !== 'DEVELOPER') {
    return <Navigate to="/dev/login" replace />;
  }
  return children;
};

export default DevAuthGuard;
