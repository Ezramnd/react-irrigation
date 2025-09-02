import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

// --- Komponen Kartu Info Bawah ---
const InfoCard = ({ title, children }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg h-full">
      <h3 className="text-lg font-bold text-gray-800 border-b pb-3 mb-4">{title}</h3>
      {children}
    </div>
  );
};

// --- Komponen Ikon Lampu ---
const LightbulbIcon = ({ status }) => {
  const isOff = status === 'MATI';
  return (
    <motion.div
      key={status} // Animate when status changes
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 10 }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className={`h-20 w-20 mb-4 transition-colors duration-500 ${isOff ? 'text-gray-300' : 'text-yellow-400'}`} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.25c-.552 0-1 .448-1 1v1.516a8.502 8.502 0 00-6.188 6.188H3.25a1 1 0 000 2h1.516a8.502 8.502 0 006.188 6.188v1.516a1 1 0 002 0v-1.516a8.502 8.502 0 006.188-6.188h1.516a1 1 0 000-2h-1.516A8.502 8.502 0 0013.016 4.766V3.25c0-.552-.448-1-1-1zM12 17a5.5 5.5 0 100-11 5.5 5.5 0 000 11z" />
        <path d="M12 7.75a1 1 0 00-1 1v.01a1 1 0 002 0V8.75a1 1 0 00-1-1z" />
      </svg>
    </motion.div>
  );
};


// --- Komponen Halaman Utama ESP ---
const EspPage = () => {
  // State untuk sidebar responsive
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
  
  // State untuk status LED dan riwayat kontrol
  const [ledStatus, setLedStatus] = useState('MATI');
  const [history, setHistory] = useState(['MQTT Terhubung']);

  // Fungsi untuk menambahkan log baru
  const addHistory = (message) => {
    const timestamp = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    setHistory(prev => [`${timestamp} - ${message}`, ...prev].slice(0, 5));
  };
  
  // Fungsi untuk menangani klik tombol
  const handleLedControl = (status, message) => {
    setLedStatus(status);
    addHistory(message);
    addHistory("Mengirim perintah ke ESP32...");
    // Di sini Anda akan menambahkan logika untuk mengirim perintah via MQTT
  };

  const statusInfo = {
    MATI: { text: 'MATI', message: 'Mode saat ini OFF', color: 'red' },
    NYALA: { text: 'NYALA', message: 'Mode saat ini ON', color: 'green' },
    KEDIP_CEPAT: { text: 'KEDIP CEPAT', message: 'Mode 1 Aktif', color: 'yellow' },
    KEDIP_LAMBAT: { text: 'KEDIP LAMBAT', message: 'Mode 2 Aktif', color: 'yellow' },
  };
  const currentStatus = statusInfo[ledStatus];
  
  // Varian animasi
  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } } };

  return (
    <div className="relative flex bg-slate-100 min-h-screen">
      <Sidebar isOpen={isSidebarOpen} />
      <div className="flex-1 flex flex-col">
        <Header onMenuClick={toggleSidebar} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <motion.div variants={containerVariants} initial="hidden" animate="visible">

            {/* Panel Kontrol Utama */}
            <motion.div variants={itemVariants} className="bg-white p-8 rounded-2xl shadow-lg mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-4">Kontrol LED ESP32</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                
                {/* Panel Status LED */}
                <motion.div 
                  key={ledStatus} // Animate saat status berubah
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`p-8 rounded-xl bg-${currentStatus.color}-50 text-center border border-${currentStatus.color}-200`}
                >
                  <span className={`text-lg font-semibold text-${currentStatus.color}-600`}>Status LED</span>
                  <h3 className={`text-5xl font-extrabold text-${currentStatus.color}-700 my-2`}>{currentStatus.text}</h3>
                  <p className={`text-${currentStatus.color}-500`}>{currentStatus.message}</p>
                </motion.div>

                {/* Panel Tombol Kontrol */}
                <div className="flex flex-col items-center">
                  <LightbulbIcon status={ledStatus} />
                  <div className="w-full max-w-sm space-y-3">
                    <motion.button onClick={() => handleLedControl('NYALA', 'Mode ON aktif')} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className="w-full text-left p-4 bg-gray-50 hover:bg-blue-100 rounded-lg font-semibold text-gray-700 transition-colors border border-gray-200">Nyalakan LED</motion.button>
                    <motion.button onClick={() => handleLedControl('KEDIP_CEPAT', 'Mode Kedip Cepat aktif')} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className="w-full text-left p-4 bg-gray-50 hover:bg-blue-100 rounded-lg font-semibold text-gray-700 transition-colors border border-gray-200">Mode 1 (Kedip Cepat)</motion.button>
                    <motion.button onClick={() => handleLedControl('KEDIP_LAMBAT', 'Mode Kedip Lambat aktif')} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className="w-full text-left p-4 bg-gray-50 hover:bg-blue-100 rounded-lg font-semibold text-gray-700 transition-colors border border-gray-200">Mode 2 (Kedip Lambat)</motion.button>
                  </div>
                </div>

              </div>
            </motion.div>

            {/* Panel Info Tambahan */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <InfoCard title="Status Koneksi">
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-center"><span className="h-2.5 w-2.5 bg-green-500 rounded-full mr-3"></span>Terhubung ke ESP32</li>
                  <li className="font-mono bg-green-50 text-green-800 p-3 rounded-lg text-xs">Broker MQTT: 192.168.1.20:9001</li>
                </ul>
              </InfoCard>
              
              <InfoCard title="Riwayat Kontrol">
                <ul className="space-y-2 text-sm text-gray-500 font-mono">
                  <AnimatePresence>
                    {history.map((log, index) => (
                      <motion.li 
                        key={log + index}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        layout
                        className="flex items-start"
                      >
                        <span className="mr-2 text-gray-400">›</span>
                        <span>{log}</span>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </InfoCard>

              <InfoCard title="Info ESP32">
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex justify-between"><span>IP Address</span> <strong className="font-mono">192.168.1.x</strong></li>
                  <li className="flex justify-between"><span>Status</span> <strong className="text-green-600">Online</strong></li>
                  <li className="flex justify-between"><span>Uptime</span> <strong className="font-mono">2h 30m</strong></li>
                </ul>
              </InfoCard>
            </div>

          </motion.div>
        </main>
      </div>

      {isSidebarOpen && <div onClick={toggleSidebar} className="fixed inset-0 bg-black opacity-50 z-20 md:hidden"></div>}
    </div>
  );
};

export default EspPage;