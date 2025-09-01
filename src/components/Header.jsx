import React from 'react';

const Header = () => {
  return (
    <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
      <div className="flex-1 relative">
        <input
          type="text"
          placeholder="Search or type command..."
          className="w-full p-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <div className="flex items-center space-x-4 ml-6">
        <button className="text-gray-500 hover:text-gray-700 transition-colors duration-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v18M3 12h18" />
          </svg>
        </button>
        <button className="text-gray-500 hover:text-gray-700 transition-colors duration-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3a9 9 0 100 18A9 9 0 0012 3z" />
          </svg>
        </button>
        <div className="flex items-center space-x-2">
          <img src="https://randomuser.me/api/portraits/men/1.jpg" alt="User Avatar" className="w-10 h-10 rounded-full" />
          <span className="font-medium text-gray-700">Musharof</span>
        </div>
      </div>
    </div>
  );
};

export default Header;