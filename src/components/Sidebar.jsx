import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import agrifamLogo from '../assets/agrifam.jpg';

// --- Komponen Ikon (untuk kerapian) ---
const DashboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
);

const AlatIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m12 0a2 2 0 100-4m0 4a2 2 0 110-4M6 16a2 2 0 100-4m0 4a2 2 0 110-4m12 0a2 2 0 100-4m0 4a2 2 0 110-4M9 9a2 2 0 100-4m0 4a2 2 0 110-4m6 0a2 2 0 100-4m0 4a2 2 0 110-4" /></svg>
);

// --- Data untuk item menu ---
const menuItems = [
  { name: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
  { name: 'Alat', path: '/alat', icon: <AlatIcon /> },
  // Tambahkan item menu lainnya di sini
];

const Sidebar = ({ isOpen }) => { // Menerima prop 'isOpen' untuk mobile
  // Varian animasi untuk container menu
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
    // Menggunakan class dari solusi sidebar responsive sebelumnya
    <div className={`
        fixed inset-y-0 left-0 bg-white border-r border-gray-200 p-4 flex flex-col z-30
        w-64 transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      <div className="flex items-center space-x-3 mb-8 px-2">
        <img src={agrifamLogo} alt="agrifam" className="w-10 h-10 rounded-lg" />
        <span className="text- font-bold text-gray-800">Agrifam Indonesia</span>
      </div>
      
      <nav className="flex-1">
        <motion.ul
          variants={sidebarVariants}
          initial="hidden"
          animate="visible"
          className="space-y-2"
        >
          {menuItems.map((item) => (
            <motion.li key={item.name} variants={itemVariants}>
              <NavLink
                to={item.path}
                className={({ isActive }) => 
                  `w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 relative
                  ${isActive 
                    ? 'bg-blue-50 text-blue-600 font-bold' 
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'}`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.div
                        layoutId="active-pill" // Kunci animasi perpindahan
                        className="absolute left-0 top-0 h-full w-1.5 bg-blue-600 rounded-r-full"
                        style={{ borderRadius: '0 8px 8px 0' }}
                      />
                    )}
                    {item.icon}
                    <span className="ml-1">{item.name}</span>
                  </>
                )}
              </NavLink>
            </motion.li>
          ))}
        </motion.ul>
      </nav>
    </div>
  );
};

export default Sidebar;