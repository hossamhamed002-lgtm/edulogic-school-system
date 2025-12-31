import React from 'react';
import { Navigate } from 'react-router-dom';

type DevGuardProps = {
  children: React.ReactElement;
};

const DevAuthGuard: React.FC<DevGuardProps> = ({ children }) => {
  const token = localStorage.getItem('dev_token');

  if (!token) {
    return <Navigate to="/developer/login" replace />;
  }
  return children;
};

export default DevAuthGuard;
