import React, { useState } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline'; // Mengimpor ikon dari Heroicons
import agrifamLogo from '../assets/agrifam.jpg';// mengimport logo Agrifam

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleEmailChange = (e) => setEmail(e.target.value);
  const handlePasswordChange = (e) => setPassword(e.target.value);
  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Email:', email);
    console.log('Password:', password);
  };

  return (
    <div className="flex min-h-screen bg-white text-gray-800">
      {/* Bagian Kiri: Form Login */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Menggunakan Heroicon untuk ikon panah */}
          <a href="#" className="flex items-center text-gray-500 hover:text-gray-700 mb-6 transition-colors duration-200">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to dashboard
          </a>
          <h1 className="text-4xl font-bold mb-2">Sign In</h1>
          <p className="text-gray-500 mb-8">
            Enter your email and password to sign in!
          </p>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2" htmlFor="email">
                Email *
              </label>
              <input
                type="email"
                id="email"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                placeholder="info@agrifam.link"
                value={email}
                onChange={handleEmailChange}
                required
              />
            </div>
            <div className="mb-4 relative">
              <label className="block text-gray-700 font-medium mb-2" htmlFor="password">
                Password *
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 pr-10"
                placeholder="Enter your password"
                value={password}
                onChange={handlePasswordChange}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 top-6 flex items-center px-4 text-gray-500"
                onClick={togglePasswordVisibility}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path className={showPassword ? 'block' : 'hidden'} d="M.01 12.01a1 1 0 011.01-1.01h21.98a1 1 0 011.01 1.01v.01a1 1 0 01-1.01 1.01H1.02a1 1 0 01-1.01-1.01v-.01z" />
                  <path className={!showPassword ? 'block' : 'hidden'} d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle className={!showPassword ? 'block' : 'hidden'} cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
            
            <div className="flex justify-between items-center mb-6 text-sm">
              <label className="flex items-center text-gray-500">
                <input type="checkbox" className="mr-2" />
                Keep me logged in
              </label>
              <a href="#" className="text-green-500 hover:underline">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              className="w-full p-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors duration-200"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>

      {/* Bagian Kanan: Visual Panel */}
      <div className="hidden lg:flex flex-1 flex-col justify-center items-center p-8 bg-gradient-to-br from-green-900 to-green-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"80\" height=\"80\" viewBox=\"0 0 80 80\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cpath d=\"M20 0H0V20H20V0ZM40 20H20V40H40V20ZM60 40H40V60H60V40ZM80 60H60V80H80V60Z\" fill=\"#ffffff\"/%3E%3C/svg%3E')"}}></div>
        <div className="z-10 text-center">
          <img src={agrifamLogo} alt="Agrifam" className="w-24 h-24 mx-auto mb-4 rounded-full" /> {/* <--- Tambahkan rounded-full di sini */}
          <h2 className="text-4xl font-bold mb-2">AGRIFAM INDONESIA</h2>
          <p className="text-lg">
            PT. AgriFamili Sarana Exedis Indonesia
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;