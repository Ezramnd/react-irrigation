import React from 'react';

const Header = () => {
  return (
    <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
    <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
      <div className="flex-1 relative flex justify-end">
        <div className="flex items-center space-x-2">
          { <img src="https://randomuser.me/api/portraits/men/1.jpg" alt="profile" className="w-10 h-10 rounded-full" /> /*profile dari luar */}
          <span className="font-medium text-gray-700">Musharof</span>
        </div>
      </div>
    </div>
  );
};

export default Header;