import React from 'react';
import DeveloperSidebar from '../components/DeveloperSidebar';
import { Outlet } from 'react-router-dom';

const DeveloperLayout: React.FC = () => {
  return (
    <div className="flex h-screen bg-slate-100">
      <DeveloperSidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default DeveloperLayout;
