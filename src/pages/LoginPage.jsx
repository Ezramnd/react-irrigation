import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import agrifamLogo from '../assets/agrifam.jpg';

const LoginPage = () => {
  // FIX 1: Pindahkan pemanggilan useNavigate ke dalam komponen.
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState(''); // State untuk pesan error

  // HAPUS: Baris ini menyebabkan infinite loop dan salah tempat.
  // navigate('/dashboard'); 

  // FIX 4: Ganti nama fungsi ini menjadi 'handleLogin' agar lebih jelas
  // dan ini adalah fungsi yang akan kita panggil dari form.
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // FIX 5: Pastikan port ini adalah port backend kamu (kemungkinan besar 5000, bukan 5173).
      await axios.post('http://localhost:5000/login', {
        email: email,
        password: password
      });
      // FIX 3: Ganti history.push dengan navigate()
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      if (error.response) {
        // Menampilkan pesan error dari backend jika ada
        setErrorMsg(error.response.data.msg);
      } else {
        setErrorMsg('Login gagal. Silakan coba lagi.');
      }
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <div className="flex min-h-screen bg-white text-gray-800">
      {/* Bagian Kiri: Form Login */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 lg:p-12">
        <div className="w-full max-w-md">
          <a href="#" className="flex items-center text-gray-500 hover:text-gray-700 mb-6 transition-colors duration-200">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to dashboard
          </a>
          <h1 className="text-4xl font-bold mb-2">Sign In</h1>
          <p className="text-gray-500 mb-8">
            Enter your email and password to sign in!
          </p>
          
          {/* Menampilkan pesan error jika ada */}
          {errorMsg && <p className="bg-red-100 text-red-700 p-3 rounded mb-4">{errorMsg}</p>}

          {/* FIX 2: Panggil fungsi handleLogin saat form di-submit */}
          <form onSubmit={handleLogin}>
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
                onChange={(e) => setEmail(e.target.value)}
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
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 top-6 flex items-center px-4 text-gray-500"
                onClick={togglePasswordVisibility}
              >
                {/* SVG Ikon mata (sudah benar) */}
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

      {/* Bagian Kanan (sudah benar) */}
      <div className="hidden lg:flex flex-1 flex-col justify-center items-center p-8 bg-gradient-to-br from-green-900 to-green-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: "url('...')" }}></div>
        <div className="z-10 text-center">
          <img src={agrifamLogo} alt="Agrifam" className="w-24 h-24 mx-auto mb-4 rounded-full" />
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