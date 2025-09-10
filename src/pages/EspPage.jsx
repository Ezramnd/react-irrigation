import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';
import toast, { Toaster } from 'react-hot-toast';

import MainLayout from '../components/MainLayout.jsx';
import EspCard from '../components/EspCard.jsx';
import ModalDetailEsp from '../components/ModalDetailEsp.jsx';
import ModalEditWifi from '../components/ModalEditWifi.jsx';

// Hubungkan ke server backend Anda
const socket = io('http://localhost:5000');

const EspPage = () => {
  const [daftarEsp, setDaftarEsp] = useState([]);
  const [selectedEsp, setSelectedEsp] = useState(null);
  const [isEditWifiVisible, setIsEditWifiVisible] = useState(false);

  useEffect(() => {
    // Listener utama untuk semua pembaruan data dari backend
    socket.on('device-update', (data) => {
      // console.log('Menerima pembaruan data perangkat:', data);
      
      // Mengganti data di daftar dengan data terbaru dari backend
      setDaftarEsp(prevList => {
          const existingEsp = prevList.find(esp => esp.id === data.id);
          if (existingEsp) {
              return prevList.map(esp => esp.id === data.id ? data : esp);
          }
          return [...prevList, data];
      });

      // Jika modal detail sedang terbuka, perbarui juga datanya secara real-time
      if (selectedEsp && selectedEsp.id === data.id) {
          setSelectedEsp(data);
      }
    });

    // Cleanup function: putuskan listener saat komponen tidak lagi ditampilkan
    return () => {
      socket.off('device-update');
    };
  }, [selectedEsp]); // Dependency agar state modal ikut terupdate

  // --- Kumpulan Fungsi Handler ---

  const handleOpenDetail = (esp) => setSelectedEsp(esp);
  const handleCloseDetail = () => setSelectedEsp(null);
  const handleOpenEditWifi = () => setIsEditWifiVisible(true);
  const handleCloseEditWifi = () => setIsEditWifiVisible(false);

  const handleLedCommand = (command) => {
    console.log(`Mengirim perintah LED: ${command}`);
    socket.emit('perintah-led', command);
    toast.success(`Perintah "${command}" terkirim!`);
  };

  const handleSaveWifi = (wifiData, setIsLoadingCallback) => {
    setIsLoadingCallback(true);
    console.log("Menyimpan data WiFi baru:", wifiData);
    // Di sini Anda bisa memanggil socket.emit atau api.post untuk menyimpan data WiFi
    setTimeout(() => {
      toast.success('Konfigurasi WiFi berhasil diperbarui!');
      setIsLoadingCallback(false);
      handleCloseEditWifi();
    }, 1500);
  };

  return (
    <MainLayout>
      <Toaster position="top-center" />
      <div className="p-6 md:p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Manajemen Perangkat ESP</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {daftarEsp.length === 0 ? (
            <p className="text-gray-500 col-span-full">Menunggu data dari perangkat ESP Anda...</p>
          ) : (
            daftarEsp.map((esp) => (
              <EspCard key={esp.id} esp={esp} onClick={() => handleOpenDetail(esp)} />
            ))
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedEsp && (
          <ModalDetailEsp 
            esp={selectedEsp} 
            onClose={handleCloseDetail} 
            onEditWifi={handleOpenEditWifi}
            onCommand={handleLedCommand} // <-- Menghubungkan fungsi perintah
          />
        )}
        {isEditWifiVisible && selectedEsp && (
          <ModalEditWifi
            currentSsid={selectedEsp.detail.wifi.ssid}
            onClose={handleCloseEditWifi}
            onSave={handleSaveWifi}
          />
        )}
      </AnimatePresence>
    </MainLayout>
  );
};

export default EspPage;