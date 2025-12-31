import React, { useEffect } from 'react';

const DeveloperDashboard: React.FC = () => {
  useEffect(() => {
    console.log('Developer Dashboard Loaded Successfully');
  }, []);

  return (
    <div className="p-6 space-y-3">
      <h1 className="text-2xl font-bold">Developer Dashboard Loaded Successfully</h1>
      <p className="text-sm text-gray-700">
        You are now in the developer area. Use the sidebar to navigate to available tools.
      </p>
    </div>
  );
};

export default DeveloperDashboard;
