import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Header = ({ onMenuClick }) => {
  const location = useLocation();
  const [isProfileOpen, setProfileOpen] = useState(false);

  // Tentukan judul berdasarkan pathname
  let pageTitle;
  switch (location.pathname) {
    case '/dashboard':
      pageTitle = 'Dashboard';
      break;
    case '/alat':
      pageTitle = 'Manajemen Alat';
      break;
    case '/esp':
      pageTitle = 'Manajemen ESP 32';
      break;

    default:
      pageTitle = 'Dashboard';
  }

  // Varian animasi untuk judul
  const titleVariants = {
    hidden: { y: -20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 120 } },
  };

  // Varian animasi untuk item di kanan
  const rightItemVariants = {
    hidden: { y: -20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 120, delay: 0.1 } },
  };

  return (
    <motion.header
      className="bg-white/80 backdrop-blur-lg border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-10"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
    >
      {/* Sisi Kiri Header */}
      <div className="flex items-center">
        {/* Tombol Hamburger (untuk mobile) */}
        <button onClick={onMenuClick} className="text-gray-600 md:hidden mr-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <motion.h1 
          key={pageTitle} // Kunci untuk re-animasi saat judul berubah
          className="text-2xl font-bold text-gray-800"
          variants={titleVariants}
          initial="hidden"
          animate="visible"
        >
          {pageTitle}
        </motion.h1>
      </div>
      
      {/* Sisi Kanan Header */}
      <motion.div 
        className="flex items-center space-x-5"
        variants={rightItemVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Search Bar */}
        <div className="relative hidden md:block">
          <input 
            type="text" 
            placeholder="Cari sesuatu..." 
            className="bg-gray-100 rounded-full py-2 pl-10 pr-4 w-64 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          />
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Tombol Notifikasi */}
        <button className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>

        {/* Profil Pengguna & Dropdown */}
        <div className="relative">
          <motion.img 
            src="https://randomuser.me/api/portraits/men/1.jpg" 
            alt="profile" 
            className="w-10 h-10 rounded-full cursor-pointer" 
            onClick={() => setProfileOpen(!isProfileOpen)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          />
          <AnimatePresence>
            {isProfileOpen && (
              <motion.div 
                className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-2 z-20"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Profil Saya</a>
                <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Pengaturan</a>
                <div className="border-t my-1"></div>
                <a href="#" className="block px-4 py-2 text-sm text-red-500 hover:bg-red-50">Logout</a>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.header> // <-- DIPERBAIKI: Tag penutup yang benar
  );
};

export default Header;