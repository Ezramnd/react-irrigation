import React from 'react';

const Sidebar = () => {
  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen p-4 flex flex-col">
      <div className="flex items-center space-x-2 mb-6">
        <img src="https://tailadmin.com/images/logo-tailadmin.svg" alt="TailAdmin Logo" className="w-8 h-8" />
        <span className="text-xl font-bold text-gray-800">TailAdmin</span>
      </div>
      <nav className="flex-1 space-y-2">
        <a href="#" className="flex items-center space-x-3 p-2 rounded-lg bg-blue-100 text-blue-700 font-semibold">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="9" rx="2" ry="2" />
            <rect x="14" y="3" width="7" height="5" rx="2" ry="2" />
            <rect x="14" y="12" width="7" height="5" rx="2" ry="2" />
            <rect x="3" y="16" width="7" height="5" rx="2" ry="2" />
          </svg>
          <span>Dashboard</span>
        </a>
        <a href="#" className="flex items-center space-x-3 p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors duration-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
            <rect x="8" y="2" width="8" height="2" rx="1" ry="1" />
            <path d="M12 18h.01" />
          </svg>
          <span>E-commerce</span>
        </a>
        {/* Tambahkan item menu lainnya di sini */}
      </nav>
      <div className="mt-auto p-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-gray-500">
          <span>Theme</span>
          <button>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3a9 9 0 100 18A9 9 0 0012 3z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;