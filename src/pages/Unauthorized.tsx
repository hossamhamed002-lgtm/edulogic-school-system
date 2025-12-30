import React from 'react';

const Unauthorized: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow text-center text-lg font-bold text-red-600">
        ليس لديك صلاحية الدخول
      </div>
    </div>
  );
};

export default Unauthorized;
