
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import ProtectedRoute from './src/auth/ProtectedRoute';
import DevAuthGuard from './src/auth/DevAuthGuard';
import Unauthorized from './src/pages/Unauthorized';
import SelectSchool from './src/pages/SelectSchool';
import DeveloperLogin from './src/pages/DeveloperLogin';
import DeveloperDashboard from './src/pages/DeveloperDashboard';
import DeveloperLayout from './src/layouts/DeveloperLayout';
import BackupManager from './components/programmer/BackupManager';
import SecuritySettingsPanel from './components/programmer/SecuritySettingsPanel';
import SecurityAlerts from './components/DeveloperPanel/SecurityAlerts';
import AuditLog from './src/pages/developer/AuditLog';
import { AppContextProvider } from './src/contexts/AppContext';
import { AuthProvider } from './src/context/AuthContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppContextProvider>
          <Routes>
            <Route path="/developer/login" element={<DeveloperLogin />} />
            <Route
              path="/developer/*"
              element={
                <DevAuthGuard>
                  <DeveloperLayout />
                </DevAuthGuard>
              }
            >
              <Route index element={<DeveloperDashboard />} />
              <Route path="dashboard" element={<DeveloperDashboard />} />
              <Route path="backups" element={<BackupManager />} />
              <Route path="security" element={<SecuritySettingsPanel />} />
              <Route path="alerts" element={<SecurityAlerts />} />
              <Route path="audit" element={<AuditLog />} />
            </Route>
            <Route path="/login" element={<App />} />
            <Route
              path="/select-school"
              element={
                <ProtectedRoute>
                  <SelectSchool />
                </ProtectedRoute>
              }
            />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <App />
                </ProtectedRoute>
              }
            />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppContextProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
