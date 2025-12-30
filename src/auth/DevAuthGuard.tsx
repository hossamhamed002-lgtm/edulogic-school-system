import React from 'react';
import { Navigate } from 'react-router-dom';

const decodeRole = (token: string): string | null => {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return (decoded.role || '').toUpperCase() || null;
  } catch {
    return null;
  }
};

type DevGuardProps = {
  children: React.ReactElement;
};

const DevAuthGuard: React.FC<DevGuardProps> = ({ children }) => {
  const token = localStorage.getItem('dev_token') || '';
  if (!token) return <Navigate to="/dev/login" replace />;
  const role = decodeRole(token);
  if (role !== 'DEVELOPER') return <Navigate to="/dev/login" replace />;
  return children;
};

export default DevAuthGuard;

