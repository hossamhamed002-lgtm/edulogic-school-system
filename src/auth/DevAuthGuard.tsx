import React from 'react';
import { Navigate } from 'react-router-dom';

type DevGuardProps = {
  children: React.ReactElement;
};

const DevAuthGuard: React.FC<DevGuardProps> = ({ children }) => {
  const token = localStorage.getItem('auth_token');
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('auth_user') || '{}');
    } catch {
      return {};
    }
  })();

  if (!token || (user?.role || '').toUpperCase() !== 'DEVELOPER') {
    return <Navigate to="/developer/login" replace />;
  }
  return children;
};

export default DevAuthGuard;
