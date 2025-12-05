import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import { FiMenu, FiUser, FiLogOut } from 'react-icons/fi';
import { FaChevronDown } from 'react-icons/fa';

const Header = ({ onMenuClick }) => {
  const location = useLocation();
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [userName, setUserName] = useState('');
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
    case '/monitoring':
      pageTitle = 'Monitoring & Jadwal';
      break;
    case '/users':
      pageTitle = 'Manajemen User';
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
      className="bg-white shadow-sm border-b border-gray-100 px-6 py-1 flex items-center justify-between sticky top-0 z-10"
      variants={headerVariants}
      initial="initial"
      animate="animate"
    >
      {/* Left side: Hamburger & Title */}
      <div className="flex items-center">
        <button 
          onClick={onMenuClick} 
          className="text-gray-700 md:hidden mr-4 hover:bg-gray-100 p-2 rounded-lg transition-colors"
        >
         <FiMenu size={24} />
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
      
      {/*Sisi Kanan: Profil, Nama, dan Dropdown */}
      <motion.div 
        className="flex items-center"
        variants={profileVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="relative">
          {/* Menggabungkan nama dan avatar menjadi satu tombol */}
          <motion.button 
            className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setProfileOpen(!isProfileOpen)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Teks sapaan dan nama pengguna */}
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-800">Hi, {userName}</p>
            </div>
            
              {/* Replaced img with FiUser icon */}
            <div className="w-10 h-10 rounded-full border-2 border-gray-200 shadow-sm bg-gray-100 flex items-center justify-center">
              <FiUser size={24} className="text-gray-700" />
            </div>

            {/* Ikon panah dropdown */}
            <motion.div 
              animate={{ rotate: isProfileOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              className="hidden sm:block"
              >
              <FaChevronDown className="text-gray-500" />
            </motion.div>
          </motion.button>
          
          {/* Dropdown menu */}
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
                <FiLogOut size={20} />
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