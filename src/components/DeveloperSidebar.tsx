import React from 'react';
import { NavLink } from 'react-router-dom';

const links = [
  { to: '/dev/dashboard', label: 'لوحة المبرمج' }
];

const DeveloperSidebar: React.FC = () => {
  return (
    <aside className="w-60 bg-slate-900 text-white h-screen shadow-lg">
      <div className="px-4 py-5 border-b border-slate-800 text-lg font-bold">Developer</div>
      <nav className="p-4 space-y-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `block px-3 py-2 rounded transition ${
                isActive ? 'bg-slate-700' : 'hover:bg-slate-800'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default DeveloperSidebar;
