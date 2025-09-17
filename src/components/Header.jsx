import React, { useState, useEffect } from 'react'; // BARU: import useEffect
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUser } from 'react-icons/fa';
import api from '../api';

const Header = ({ onMenuClick }) => {
  const location = useLocation();
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [userName, setUserName] = useState(''); // BARU: State untuk nama pengguna
  const navigate = useNavigate();

  // BARU: Mengambil data pengguna saat komponen dimuat
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Asumsi backend punya endpoint /me untuk mengambil data user
        const response = await api.get('/me'); 
        // Mengambil nama dari response, contoh 'Azis Maulana'
        setUserName(response.data.name); 
      } catch (error) {
        console.error("Gagal mengambil data user:", error);
        // Jika gagal, bisa set nama default atau biarkan kosong
        setUserName('Azis Maulana'); 
      }
    };

    fetchUserData();
  }, []); // Array kosong agar hanya berjalan sekali

  // Definisi page title (tidak ada perubahan)
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

  // Animation variants (tidak ada perubahan)
  const headerVariants = {
    initial: { y: -100 },
    animate: { y: 0, transition: { type: 'spring', stiffness: 70, damping: 20 } }
  };
  const titleVariants = {
    hidden: { y: -20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100, delay: 0.1 } }
  };
  const profileVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 100, delay: 0.2 } }
  };
  const dropdownVariants = {
    hidden: { opacity: 0, y: -10, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 400, damping: 25 } },
    exit: { opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.2 } }
  };

  const handleLogout = async () => {
    try {
      await api.delete('/logout');
      localStorage.removeItem('token');
      navigate('/');
    } catch (error) {
      console.error("Gagal untuk logout:", error);
    }
  };

  return (
    <motion.header
      className="bg-white shadow-sm border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10"
      variants={headerVariants}
      initial="initial"
      animate="animate"
    >
      {/* Left side: Hamburger & Title (tidak ada perubahan) */}
      <div className="flex items-center">
        <button 
          onClick={onMenuClick} 
          className="text-gray-700 md:hidden mr-4 hover:bg-gray-100 p-2 rounded-lg transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <motion.h1 
          key={pageTitle}
          className="text-2xl font-semibold text-gray-800"
          variants={titleVariants}
          initial="hidden"
          animate="visible"
        >
          {pageTitle}
        </motion.h1>
      </div>
      
      {/* DIUBAH: Sisi Kanan: Profil, Nama, dan Dropdown */}
      <motion.div 
        className="flex items-center"
        variants={profileVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="relative">
          {/* DIUBAH: Menggabungkan nama dan avatar menjadi satu tombol */}
          <motion.button 
            className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setProfileOpen(!isProfileOpen)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* BARU: Teks sapaan dan nama pengguna */}
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-800">Hi, {userName}</p>
            </div>
            
            <FaUser className="w-10 h-10 rounded-full border-2 border-gray-200 shadow-sm text-gray-600 bg-gray-100 p-2" />
            {/* BARU: Ikon panah dropdown */}
            <motion.svg 
                animate={{ rotate: isProfileOpen ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 hidden sm:block" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </motion.svg>
          </motion.button>
          
          {/* Dropdown menu (tidak ada perubahan) */}
          <AnimatePresence>
            {isProfileOpen && (
              <motion.div 
                className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-2 border border-gray-100 overflow-hidden"
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <button 
                  onClick={handleLogout} 
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="font-medium">Logout</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.header>
  );
};

export default Header;