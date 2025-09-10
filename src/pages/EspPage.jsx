import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';
import toast, { Toaster } from 'react-hot-toast';
import api from '../api'; // Impor api client Anda

import MainLayout from '../components/MainLayout.jsx';
import EspCard from '../components/EspCard.jsx';
import ModalDetailEsp from '../components/ModalDetailEsp.jsx';
import ModalEditWifi from '../components/ModalEditWifi.jsx';

const socket = io('http://localhost:5000');

const EspPage = () => {
    const [daftarEsp, setDaftarEsp] = useState([]);
    const [selectedEsp, setSelectedEsp] = useState(null);
    const [isEditWifiVisible, setIsEditWifiVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // --- BARU: Mengambil data awal dari API ---
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const response = await api.get('/alat');
                setDaftarEsp(response.data);
            } catch (error) {
                toast.error("Gagal memuat daftar perangkat awal.");
                console.error("Gagal fetch data awal:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        socket.on('device-update', (updatedDevice) => {
            console.log('Menerima pembaruan data perangkat:', updatedDevice);
            setDaftarEsp(prevList => {
                const existingEspIndex = prevList.findIndex(esp => esp.id === updatedDevice.id);
                // Jika perangkat sudah ada di daftar, perbarui
                if (existingEspIndex !== -1) {
                    const newList = [...prevList];
                    newList[existingEspIndex] = updatedDevice;
                    return newList;
                }
                // Jika perangkat belum ada (misalnya baru diklaim), tambahkan
                return [...prevList, updatedDevice];
            });

            if (selectedEsp && selectedEsp.id === updatedDevice.id) {
                setSelectedEsp(updatedDevice);
            }
        });

        return () => {
            socket.off('device-update');
        };
    }, [selectedEsp]);

    const handleOpenDetail = (esp) => setSelectedEsp(esp);
    const handleCloseDetail = () => setSelectedEsp(null);
    const handleOpenEditWifi = () => setIsEditWifiVisible(true);
    const handleCloseEditWifi = () => setIsEditWifiVisible(false);

    // ... (sisa handler Anda) ...
    const handleSaveWifi = (wifiData, setIsLoadingCallback) => {
        // Implementasi sesungguhnya akan ada di sini
        toast.info("Fitur edit WiFi belum diimplementasikan.");
    };

    return (
        <MainLayout>
            <Toaster position="top-center" />
            <div className="p-6 md:p-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-8">Manajemen Perangkat ESP</h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {isLoading ? (
                        <p className="text-gray-500 col-span-full">Memuat perangkat...</p>
                    ) : daftarEsp.length === 0 ? (
                        <p className="text-gray-500 col-span-full">Belum ada perangkat yang terdaftar atau diklaim.</p>
                    ) : (
                        daftarEsp.map((esp) => (
                            <EspCard key={esp.id} esp={esp} onClick={() => handleOpenDetail(esp)} />
                        ))
                    )}
                </div>
            </div>
            <AnimatePresence>
                {/* ... (Modal Anda tetap sama) ... */}
            </AnimatePresence>
        </MainLayout>
    );
};

export default EspPage;