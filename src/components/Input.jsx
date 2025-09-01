import React from 'react';

const Input = ({ label, type = 'text', className = '', ...props }) => {
  return (
    <div className="relative">
      <label className="block text-gray-700 font-medium mb-2">{label}</label>
      <input
        type={type}
        className={`w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${className}`}
        {...props}
      />
    </div>
  );
};

export default Input;