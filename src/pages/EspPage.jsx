import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import MainLayout from '../components/MainLayout'; // <-- 1. Impor MainLayout 

// --- Konfigurasi Socket.IO ---
const BACKEND_URL = 'http://localhost:5000';
const socket = io(BACKEND_URL);

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
  const getColor = () => {
    switch (status) {
      case 'MATI': return 'text-gray-300';
      case 'NYALA': return 'text-yellow-400';
      case 'KEDIP_CEPAT': return 'text-blue-400';
      case 'KEDIP_LAMBAT': return 'text-orange-400';
      default: return 'text-gray-300';
    }
  };

  return (
    <motion.div
      key={status}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 10 }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className={`h-20 w-20 mb-4 transition-colors duration-500 ${getColor()}`} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.25c-.552 0-1 .448-1 1v1.516a8.502 8.502 0 00-6.188 6.188H3.25a1 1 0 000 2h1.516a8.502 8.502 0 006.188 6.188v1.516a1 1 0 002 0v-1.516a8.502 8.502 0 006.188-6.188h1.516a1 1 0 000-2h-1.516A8.502 8.502 0 0013.016 4.766V3.25c0-.552-.448-1-1-1zM12 17a5.5 5.5 0 100-11 5.5 5.5 0 000 11z" />
        <path d="M12 7.75a1 1 0 00-1 1v.01a1 1 0 002 0V8.75a1 1 0 00-1-1z" />
      </svg>
    </motion.div>
  );
};

// --- Komponen Status Connection ---
const ConnectionStatus = ({ isConnected }) => (
  <div className="flex items-center">
    <span className={`h-2.5 w-2.5 ${isConnected ? 'bg-green-500' : 'bg-red-500'} rounded-full mr-2`}></span>
    <span className={`text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
      {isConnected ? 'Terhubung' : 'Terputus'}
    </span>
  </div>
);

// --- Komponen Halaman Utama ESP ---
const EspPage = () => {
  // State untuk status LED dan riwayat kontrol
  const [ledStatus, setLedStatus] = useState('MATI');
  const [history, setHistory] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [mqttConnected, setMqttConnected] = useState(false);
  const [sensorData, setSensorData] = useState(null);
  const [espInfo, setEspInfo] = useState({
    ip: '192.168.1.x',
    status: 'Offline', // Nilai awal 'Offline'
    uptime: '-'
  });

  // Socket.IO event handlers
  useEffect(() => {
    // Saat terhubung ke server
    socket.on('connect', () => {
      setIsConnected(true);
      addHistory('Terhubung ke server');
    });

    // Saat terputus dari server
    socket.on('disconnect', () => {
      setIsConnected(false);
      setMqttConnected(false);
      addHistory('Terputus dari server');
      // Set status ESP32 ke offline jika server terputus
      setEspInfo(prev => ({...prev, status: 'Offline'}));
    });

    // Status koneksi MQTT
    socket.on('mqtt-status', (status) => {
      setMqttConnected(status.connected);
      addHistory(status.connected ? 'MQTT broker terhubung' : 'MQTT broker terputus');
    });

    // Menerima data sensor dari ESP32
    socket.on('data-sensor', (data) => {
      setSensorData(data);
      if (typeof data === 'object' && data !== null) {
        if (data.uptime) {
          setEspInfo(prev => ({...prev, uptime: data.uptime}));
        }
        if (data.ip) {
          setEspInfo(prev => ({...prev, ip: data.ip}));
        }
        // Jika data sensor diterima, asumsikan ESP32 Online
        setEspInfo(prev => ({...prev, status: 'Online'}));
      }
    });

    // ✅ BARU: Event handler untuk status koneksi ESP32 dari backend
    socket.on('esp-status', (data) => {
      if (data && data.status) {
        const newStatus = data.status.charAt(0).toUpperCase() + data.status.slice(1);
        setEspInfo(prev => ({...prev, status: newStatus}));
        addHistory(`Status ESP32 berubah: ${newStatus}`);
      }
    });

    // Status perintah yang dikirim
    socket.on('command-status', (status) => {
      if (status.success) {
        addHistory(`Perintah ${status.command} berhasil dikirim`);
      } else {
        addHistory(`Gagal: ${status.message}`);
      }
    });

    // Error handler
    socket.on('error', (error) => {
      addHistory(`Error: ${error.message}`);
    });

    // Cleanup
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('mqtt-status');
      socket.off('data-sensor');
      socket.off('esp-status'); // Jangan lupa tambahkan cleanup
      socket.off('command-status');
      socket.off('error');
    };
  }, []);

  // Mengkonversi mode internal ke mode ESP32
  const getEspMode = (mode) => {
    switch (mode) {
      case 'NYALA': return 'ON';
      case 'MATI': return 'OFF';
      case 'KEDIP_CEPAT': return 'MODE1';
      case 'KEDIP_LAMBAT': return 'MODE2';
      default: return 'OFF';
    }
  };

  // Fungsi untuk menambahkan log baru
  const addHistory = (message) => {
    const timestamp = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setHistory(prev => [`${timestamp} - ${message}`, ...prev].slice(0, 8));
  };

  // Fungsi untuk menangani klik tombol
  const handleLedControl = (status, message) => {
    setLedStatus(status);
    addHistory(message);

    if (isConnected) {
      const command = getEspMode(status);
      socket.emit('perintah-led', command);
      addHistory(`Mengirim perintah: ${command}`);
    } else {
      addHistory('Tidak dapat mengirim perintah: Tidak terhubung ke server');
    }
  };

  // Mapping status LED untuk warna dan pesan
  const statusInfo = {
    'MATI': { text: 'MATI', message: 'Mode saat ini OFF', bgColor: 'bg-red-50', textColor: 'text-red-700', borderColor: 'border-red-200' },
    'NYALA': { text: 'NYALA', message: 'Mode saat ini ON', bgColor: 'bg-green-50', textColor: 'text-green-700', borderColor: 'border-green-200' },
    'KEDIP_CEPAT': { text: 'KEDIP CEPAT', message: 'Mode 1 Aktif', bgColor: 'bg-blue-50', textColor: 'text-blue-700', borderColor: 'border-blue-200' },
    'KEDIP_LAMBAT': { text: 'KEDIP LAMBAT', message: 'Mode 2 Aktif', bgColor: 'bg-orange-50', textColor: 'text-orange-700', borderColor: 'border-orange-200' },
  };
  const currentStatus = statusInfo[ledStatus] || statusInfo['MATI'];

  // Varian animasi
  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } } };

  return (
        <MainLayout className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <motion.div variants={containerVariants} initial="hidden" animate="visible">

            {/* Panel Kontrol Utama */}
            <motion.div variants={itemVariants} className="bg-white p-8 rounded-2xl shadow-lg mb-8">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-xl font-bold text-gray-800">Kontrol LED ESP32</h2>
                <ConnectionStatus isConnected={isConnected} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

                {/* Panel Status LED */}
                <motion.div
                  key={ledStatus}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`p-8 rounded-xl ${currentStatus.bgColor} text-center border ${currentStatus.borderColor}`}
                >
                  <span className={`text-lg font-semibold ${currentStatus.textColor}`}>Status LED</span>
                  <h3 className={`text-4xl md:text-5xl font-extrabold ${currentStatus.textColor} my-2`}>{currentStatus.text}</h3>
                  <p className={currentStatus.textColor}>{currentStatus.message}</p>
                </motion.div>

                {/* Panel Tombol Kontrol */}
                <div className="flex flex-col items-center">
                  <LightbulbIcon status={ledStatus} />
                  <div className="w-full max-w-sm space-y-3">
                    <motion.button
                      onClick={() => handleLedControl('NYALA', 'Mode ON aktif')}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full text-left p-4 ${ledStatus === 'NYALA' ? 'bg-green-100 text-green-700 border-green-300' : 'bg-gray-50 text-gray-700 border-gray-200'} rounded-lg font-semibold transition-colors border hover:bg-green-50`}
                      disabled={!isConnected}
                    >
                      Nyalakan LED
                    </motion.button>

                    <motion.button
                      onClick={() => handleLedControl('KEDIP_CEPAT', 'Mode Kedip Cepat aktif')}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full text-left p-4 ${ledStatus === 'KEDIP_CEPAT' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-gray-50 text-gray-700 border-gray-200'} rounded-lg font-semibold transition-colors border hover:bg-blue-50`}
                      disabled={!isConnected}
                    >
                      Mode 1 (Kedip Cepat)
                    </motion.button>

                    <motion.button
                      onClick={() => handleLedControl('KEDIP_LAMBAT', 'Mode Kedip Lambat aktif')}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full text-left p-4 ${ledStatus === 'KEDIP_LAMBAT' ? 'bg-orange-100 text-orange-700 border-orange-300' : 'bg-gray-50 text-gray-700 border-gray-200'} rounded-lg font-semibold transition-colors border hover:bg-orange-50`}
                      disabled={!isConnected}
                    >
                      Mode 2 (Kedip Lambat)
                    </motion.button>

                    <motion.button
                      onClick={() => handleLedControl('MATI', 'Mode OFF aktif')}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full text-left p-4 ${ledStatus === 'MATI' ? 'bg-red-100 text-red-700 border-red-300' : 'bg-gray-50 text-gray-700 border-gray-200'} rounded-lg font-semibold transition-colors border hover:bg-red-50`}
                      disabled={!isConnected}
                    >
                      Matikan LED
                    </motion.button>
                  </div>
                </div>

              </div>
            </motion.div>

            {/* Panel Info Tambahan */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <InfoCard title="Status Koneksi">
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-center">
                    <span className={`h-2.5 w-2.5 ${isConnected ? 'bg-green-500' : 'bg-red-500'} rounded-full mr-3`}></span>
                    {isConnected ? 'Terhubung ke Server' : 'Terputus dari Server'}
                  </li>
                  <li className="flex items-center">
                    <span className={`h-2.5 w-2.5 ${mqttConnected ? 'bg-green-500' : 'bg-red-500'} rounded-full mr-3`}></span>
                    {mqttConnected ? 'MQTT Broker Terhubung' : 'MQTT Broker Terputus'}
                  </li>
                  <li className={`font-mono ${mqttConnected ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'} p-3 rounded-lg text-xs mt-3`}>
                    Broker MQTT: 192.168.1.20:9001
                  </li>
                </ul>
              </InfoCard>

              <InfoCard title="Riwayat Kontrol">
                <div className="h-[160px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  <ul className="space-y-2 text-sm text-gray-500 font-mono">
                    <AnimatePresence>
                      {history.length > 0 ? (
                        history.map((log, index) => (
                          <motion.li
                            key={log + index}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, height: 0 }}
                            layout
                            className="flex items-start"
                          >
                            <span className="mr-2 text-gray-400">›</span>
                            <span>{log}</span>
                          </motion.li>
                        ))
                      ) : (
                        <li className="text-gray-400 italic">Belum ada aktivitas</li>
                      )}
                    </AnimatePresence>
                  </ul>
                </div>
              </InfoCard>

              <InfoCard title="Info ESP32">
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex justify-between">
                    <span>IP Address</span>
                    <strong className="font-mono">{espInfo.ip}</strong>
                  </li>
                  <li className="flex justify-between">
                    <span>Status</span>
                    <strong className={espInfo.status === 'Online' ? 'text-green-600' : 'text-red-600'}>
                      {espInfo.status}
                    </strong>
                  </li>
                  <li className="flex justify-between">
                    <span>Uptime</span>
                    <strong className="font-mono">{espInfo.uptime}</strong>
                  </li>
                  {sensorData && typeof sensorData === 'object' && (
                    <li className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <div className="text-xs text-blue-800 font-semibold mb-1">Sensor Data:</div>
                      <div className="font-mono text-xs text-blue-700">
                        {Object.entries(sensorData).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span>{key}:</span>
                            <span>{value}</span>
                          </div>
                        ))}
                      </div>
                    </li>
                  )}
                </ul>
              </InfoCard>
            </div>

          </motion.div>
        </MainLayout>
  );
};

export default EspPage;