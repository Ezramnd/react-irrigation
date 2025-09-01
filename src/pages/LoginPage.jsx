import React, { useState } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline'; // Mengimpor ikon dari Heroicons
import { FaXTwitter } from 'react-icons/fa6'; // Mengimpor ikon dari React Icons

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
          
          {/* Tombol Social Login */}
          <div className="flex space-x-4 mb-8">
            <button className="flex-1 flex items-center justify-center p-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors duration-200">
              <img src="https://www.google.com/favicon.ico" alt="Google icon" className="w-5 h-5 mr-2" />
              Sign in with Google
            </button>
            {/* Menggunakan React Icon untuk ikon X/Twitter */}
            <button className="flex-1 flex items-center justify-center p-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors duration-200">
              <FaXTwitter className="w-5 h-5 mr-2" />
              Sign in with X
            </button>
          </div>

          <div className="flex items-center justify-between mb-8">
            <span className="h-px w-1/3 bg-gray-300"></span>
            <span className="text-gray-500 text-sm">Or</span>
            <span className="h-px w-1/3 bg-gray-300"></span>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2" htmlFor="email">
                Email *
              </label>
              <input
                type="email"
                id="email"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                placeholder="info@gmail.com"
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
              <a href="#" className="text-blue-500 hover:underline">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              className="w-full p-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors duration-200"
            >
              Sign In
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-500">
            Don't have an account? <a href="#" className="text-blue-500 hover:underline">Sign Up</a>
          </div>
        </div>
      </div>

      {/* Bagian Kanan: Visual Panel */}
      <div className="hidden lg:flex flex-1 flex-col justify-center items-center p-8 bg-gradient-to-br from-blue-900 to-indigo-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"80\" height=\"80\" viewBox=\"0 0 80 80\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cpath d=\"M20 0H0V20H20V0ZM40 20H20V40H40V20ZM60 40H40V60H60V40ZM80 60H60V80H80V60Z\" fill=\"#ffffff\"/%3E%3C/svg%3E')"}}></div>
        <div className="z-10 text-center">
          <img src="https://tailadmin.com/images/logo-tailadmin.svg" alt="TailAdmin Logo" className="w-24 h-24 mx-auto mb-4" />
          <h2 className="text-4xl font-bold mb-2">TailAdmin</h2>
          <p className="text-lg">
            Free and Open-Source Tailwind CSS Admin Dashboard Template
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;