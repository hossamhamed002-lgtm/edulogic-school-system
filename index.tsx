
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import ProtectedRoute from './src/auth/ProtectedRoute';
import Unauthorized from './src/pages/Unauthorized';
import SelectSchool from './src/pages/SelectSchool';
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
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <App />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['DEVELOPER']}>
                  <App />
                </ProtectedRoute>
              }
            />
            <Route
              path="/select-school"
              element={
                <ProtectedRoute>
                  <SelectSchool />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<App />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppContextProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
