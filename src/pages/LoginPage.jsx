import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import agrifamLogo from '../assets/agrifam.jpg';
import api from '../api';

// --- Komponen Ikon Mata ---
const EyeIcon = ({ isOpen }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    {isOpen ? (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242" />
    )}
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l-1.414-1.414A8.963 8.963 0 0112 3a8.963 8.963 0 011.414 14.586L12 19z" />
  </svg>
);


const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);

  // LoginPage.jsx

  const handleLogin = async (e) => {
      e.preventDefault();
      try {
          // 1. Tangkap respons dari server dalam sebuah variabel
          const response = await api.post('/login', { email, password, keepLoggedIn });

          // 2. Simpan accessToken dari respons ke localStorage (INI BAGIAN KUNCINYA)
          localStorage.setItem('token', response.data.accessToken);

          // 3. Arahkan ke halaman dashboard (atau alat) setelah token tersimpan
          navigate('/dashboard'); // Pastikan rute ini benar, jika halaman alat ada di '/alat', ganti ke '/alat'

      } catch (error) {
          console.error('Login failed:', error);
          setErrorMsg(error.response ? error.response.data.msg : 'Login gagal. Periksa koneksi Anda.');
      }
  };
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <div className="flex min-h-screen bg-white text-gray-800">
      {/* Bagian Kiri: Form Login */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 lg:p-12">
        <motion.div 
          className="w-full max-w-md"
          variants={containerVariants} initial="hidden" animate="visible"
        >
          <motion.div variants={itemVariants} className="flex items-center space-x-3 mb-8">
            <img src={agrifamLogo} alt="Agrifam" className="w-12 h-12" />
            <span className="text-2xl font-bold text-gray-800">Agrifam Indonesia</span>
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="text-4xl font-extrabold mb-2 text-gray-900">
            Selamat Datang Kembali!
          </motion.h1>
          <motion.p variants={itemVariants} className="text-gray-500 mb-8">
            Silakan masukkan detail Anda untuk melanjutkan.
          </motion.p>
          
          <AnimatePresence>
            {errorMsg && (
              <motion.p 
                className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm font-medium"
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              >
                {errorMsg}
              </motion.p>
            )}
          </AnimatePresence>

          <form onSubmit={handleLogin}>
            <motion.div variants={itemVariants} className="mb-4">
              <label className="block text-sm font-semibold text-gray-600 mb-2" htmlFor="email">Email</label>
              <input type="email" id="email" className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition text-gray-800 placeholder-gray-400 shadow-sm" placeholder="info@agrifam.link" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </motion.div>

            <motion.div variants={itemVariants} className="mb-4 relative">
              <label className="block text-sm font-semibold text-gray-600 mb-2" htmlFor="password">Password</label>
              <input type={showPassword ? 'text' : 'password'} id="password" className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition text-gray-800 placeholder-gray-400 shadow-sm pr-12" placeholder="Masukkan password Anda" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button type="button" className="absolute inset-y-0 right-0 top-7 flex items-center px-4 text-gray-500 hover:text-green-600 transition-colors" onClick={() => setShowPassword(!showPassword)}>
                <EyeIcon isOpen={showPassword} />
              </button>
            </motion.div>
            
            <motion.div variants={itemVariants} className="flex justify-between items-center mb-6 text-sm">
              <label className="flex items-center text-gray-500 select-none">
                <input type="checkbox" className="mr-2 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                checked={keepLoggedIn}                         
                onChange={(e) => setKeepLoggedIn(e.target.checked)}
                />
                Keep me logged in
              </label>
              <a href="#" className="text-green-600 hover:underline font-semibold">
                Lupa password?
              </a>
            </motion.div>

            <motion.div variants={itemVariants}>
              <motion.button type="submit" className="w-full p-4 bg-green-600 text-white rounded-xl font-bold shadow-md hover:bg-green-700" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} transition={{ type: 'spring', stiffness: 300 }}>
                Sign In
              </motion.button>
            </motion.div>
          </form>
        </motion.div>
      </div>

      {/* --- BAGIAN KANAN YANG DIPERBAIKI DENGAN WARNA HIJAU --- */}
      <motion.div 
        className="hidden lg:flex flex-1 flex-col justify-center items-center p-8 bg-gradient-to-br from-green-800 to-gray-900 text-white relative overflow-hidden"
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')" }}></div>
        
        <motion.div 
          className="z-10 text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.img 
            src={agrifamLogo} 
            alt="Agrifam" 
            className="w-28 h-28 mx-auto mb-6 rounded-full shadow-2xl"
            variants={itemVariants}
          />
          <motion.h2 
            className="text-5xl font-extrabold mb-2"
            style={{ textShadow: '2px 2px 10px rgba(0,0,0,0.3)' }}
            variants={itemVariants}
          >
            AGRIFAM INDONESIA
          </motion.h2>
          <motion.p 
            className="text-lg text-white/80"
            variants={itemVariants}
          >
            PT. AgriFamili Sarana Exedis Indonesia
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginPage;