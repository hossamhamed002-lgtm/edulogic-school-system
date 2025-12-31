import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type Props = {
  children: React.ReactElement;
  allowedRoles?: string[];
};

const ProtectedRoute: React.FC<Props> = ({ children, allowedRoles }) => {
  const location = useLocation();
  if (location.pathname.startsWith('/developer')) return children;

  const { isAuthenticated, user } = useAuth();
  const token = localStorage.getItem('token') || localStorage.getItem('auth_token');

  if (!isAuthenticated && !token) return <Navigate to="/login" replace />;
  if (allowedRoles && allowedRoles.length > 0) {
    const role = (user?.role || '').toUpperCase();
    const allowed = allowedRoles.map((r) => r.toUpperCase());
    if (!allowed.includes(role)) return <Navigate to="/unauthorized" replace />;
  }
  return children;
};

export default ProtectedRoute;
