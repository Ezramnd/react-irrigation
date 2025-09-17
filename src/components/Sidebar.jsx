import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import agrifamLogo from '../assets/agrifam.jpg';
import { useAuth } from '../context/AuthContext'; 
import { MdDashboard } from "react-icons/md";
import { FaTools, FaUsers } from "react-icons/fa";
import { IoHardwareChipOutline } from "react-icons/io5";


const Sidebar = ({ isOpen }) => {
  const { user } = useAuth(); // Ambil data user untuk cek peran
  
  // --- Data untuk item menu ---
  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <MdDashboard className="h-6 w-6" /> },
    { name: 'Alat', path: '/alat', icon: <FaTools className="h-6 w-6" /> },
    { name: 'Monitoring', path: '/monitoring', icon: <IoHardwareChipOutline className="h-6 w-6" /> },
  ];
  
  const sidebarVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.07, // Jeda antar item menu saat muncul
      },
    },
  };

  // Varian animasi untuk setiap item menu
  const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 120 },
    },
  };

return (
    <div className={`fixed inset-y-0 left-0 bg-white border-r border-gray-200 p-4 flex flex-col z-30 w-64 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* Header Sidebar */}
      <div className="flex items-center space-x-3 mb-8 px-2">
        <img src={agrifamLogo} alt="agrifam" className="w-10 h-10 rounded-lg" />
        <span className="text-xl font-bold text-gray-800">Agrifam Indonesia</span>
      </div>
      
      {/* Navigasi Utama */}
      <nav className="flex-1">
        <motion.ul variants={sidebarVariants} initial="hidden" animate="visible" className="space-y-2">
          {/* Tampilkan item menu standar */}
          {menuItems.map((item) => (
            <motion.li key={item.name} variants={itemVariants}>
              <NavLink to={item.path} className={({ isActive }) => `w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 relative ${isActive ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'}`}>
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.div layoutId="active-pill" className="absolute left-0 top-0 h-full w-1.5 bg-blue-600 rounded-r-full" style={{ borderRadius: '0 8px 8px 0' }} />
                    )}
                    {item.icon}
                    <span className="ml-1">{item.name}</span>
                  </>
                )}
              </NavLink>
            </motion.li>
          ))}

          {/* Tampilkan menu admin secara kondisional */}
          {user && user.role === 'admin' && (
            <motion.li variants={itemVariants}>
              <NavLink to="/users" className={({ isActive }) => `w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 relative ${isActive ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'}`}>
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.div layoutId="active-pill" className="absolute left-0 top-0 h-full w-1.5 bg-blue-600 rounded-r-full" style={{ borderRadius: '0 8px 8px 0' }} />
                    )}
                    <FaUsers className="h-6 w-6" />
                    <span className="ml-1">Manajemen User</span>
                  </>
                )}
              </NavLink>
            </motion.li>
          )}
        </motion.ul>
      </nav>

      {/* Bagian bawah sidebar sekarang kosong */}
      <div className="mt-auto">
        {/* Tidak ada tombol logout di sini */}
      </div>
    </div>
  );
};

export default Sidebar;