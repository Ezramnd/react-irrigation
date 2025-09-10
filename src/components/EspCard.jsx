import React from 'react';
import { motion } from 'framer-motion';

const EspCard = ({ esp, onClick }) => { 
  // Pastikan properti yang di-destructure cocok dengan data Anda
  const { lokasi, namaEsp, status } = esp;

  // Logika untuk badge status koneksi
  const statusInfo = {
    active: { text: 'Online', textColor: 'text-green-600', bgColor: 'bg-green-100' },
    inactive: { text: 'Offline', textColor: 'text-red-600', bgColor: 'bg-red-100' }
  };
  const currentStatus = statusInfo[status] || { text: 'Unknown', textColor: 'text-gray-600', bgColor: 'bg-gray-100' };

  return (
    <motion.div
      layout
      layoutId={`card-container-${esp.id}`}
      className="bg-white rounded-2xl shadow-lg overflow-hidden transform hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col min-h-[180px]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
    >
      <div className="p-6 flex-grow">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-gray-500 text-sm font-medium">{lokasi}</span>
            <h2 className="text-xl font-bold text-gray-800 mt-1">{namaEsp}</h2>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${currentStatus.textColor} ${currentStatus.bgColor}`}>
            {currentStatus.text}
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-6 py-3 mt-auto">
        <span className="text-green-600 font-semibold text-sm hover:underline">
          Lihat Detail →
        </span>
      </div>
    </motion.div>
  );
};

export default EspCard;