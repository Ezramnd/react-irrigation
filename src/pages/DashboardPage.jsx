import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import MainLayout from '../components/MainLayout';
import ClimateDashboard from '../components/ClimateDashboard';
import SmartIrrigationDashboard from '../components/SmartIrrigationDashboard';
import { FiHardDrive, FiLoader, FiAlertTriangle } from 'react-icons/fi';

const DashboardPage = () => {
    // State untuk menyimpan daftar semua alat
    const [devices, setDevices] = useState([]);
    // State untuk menyimpan ID alat yang dipilih dari dropdown
    const [selectedDeviceId, setSelectedDeviceId] = useState('');
    // State untuk menyimpan data detail dari alat yang dipilih
    const [selectedDevice, setSelectedDevice] = useState(null);
    // State untuk status loading dan error
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // useEffect untuk mengambil daftar alat saat komponen dimuat pertama kali
    useEffect(() => {
    const fetchDevices = async () => {
        try {
           // 1. Ambil token dari local storage (atau tempat Anda menyimpannya)
            const token = localStorage.getItem('token'); 

            // Jika tidak ada token, jangan lanjutkan
            if (!token) {
                setError("Anda tidak terautentikasi. Silakan login kembali.");
                setIsLoading(false);
                return;
            }

            // 2. Buat konfigurasi header dengan token
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            };
            
            // 3. Kirim request dengan menyertakan config
            const response = await axios.get('/api/alat', config);
            
            // 💡 TIPS DEBUG: Lihat struktur asli data dari API
            console.log('Isi data dari API /alat:', response.data);

            // ✅ PERBAIKAN: Cek apakah response.data adalah sebuah array
            if (Array.isArray(response.data)) {
                setDevices(response.data);
                // Jika ada alat, pilih alat pertama secara default
                if (response.data.length > 0) {
                    setSelectedDeviceId(response.data[0].id);
                }
            } else {
                // Jika bukan array, mungkin array-nya ada di dalam properti lain?
                // Contoh jika formatnya { devices: [...] }, Anda bisa gunakan response.data.devices
                // Untuk sekarang, kita akan anggap ini sebagai error format.
                console.error("Data yang diterima dari API bukanlah array:", response.data);
                setError("Gagal memuat daftar alat karena format data salah.");
                setDevices([]); // Atur ke array kosong untuk mencegah error .map()
            }

        } catch (err) {
            setError("Gagal memuat daftar alat. Silakan coba lagi.");
            console.error("Error fetching devices:", err);
            setDevices([]); // Pastikan tetap array kosong jika ada error
        } finally {
            setIsLoading(false);
        }
    };

    fetchDevices();
}, []); // Array dependensi kosong berarti hanya dijalankan sekali saat mount

    // useEffect untuk mengambil detail alat setiap kali alat yang dipilih berubah
    useEffect(() => {
    // Jangan jalankan jika tidak ada ID alat yang dipilih
    if (!selectedDeviceId) {
        setSelectedDevice(null);
        return;
    }

    const fetchDeviceDetails = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // 1. Ambil token dari local storage
            const token = localStorage.getItem('token');
            if (!token) {
                setError("Autentikasi gagal. Silakan login kembali.");
                setIsLoading(false);
                return;
            }

            // 2. Buat konfigurasi header dengan token
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            };

            // 3. Kirim request untuk detail alat DENGAN menyertakan config
            const response = await axios.get(`/api/alat/${selectedDeviceId}`, config);
            setSelectedDevice(response.data);

        } catch (err) {
            if (err.response && err.response.status === 401) {
                setError("Sesi Anda berakhir. Gagal memuat detail alat.");
            } else {
                setError(`Gagal memuat data untuk alat.`);
            }
            console.error("Error fetching device details:", err);
        } finally {
            setIsLoading(false);
        }
    };

    fetchDeviceDetails();
}, [selectedDeviceId]); // Dijalankan setiap kali selectedDeviceId berubah

    const handleDeviceChange = (e) => {
        setSelectedDeviceId(e.target.value);
    };

    // Fungsi untuk merender konten utama berdasarkan state
    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <FiLoader className="animate-spin text-4xl mb-4" />
                    <p className="font-semibold">Memuat Data...</p>
                </div>
            );
        }

        if (error) {
            return (
                 <div className="flex flex-col items-center justify-center h-64 text-red-500 bg-red-50 rounded-lg p-6">
                    <FiAlertTriangle className="text-4xl mb-4" />
                    <p className="font-semibold text-center">{error}</p>
                </div>
            );
        }

        if (!selectedDevice) {
             return (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <FiHardDrive className="text-4xl mb-4" />
                    <p className="font-semibold">Pilih alat untuk menampilkan data.</p>
                </div>
            );
        }

        switch (selectedDevice.jenis) {
            case 'Climate':
                return <ClimateDashboard />;
            case 'Smart Irrigation':
                return <SmartIrrigationDashboard device={selectedDevice} />;
            default:
                return (
                    <div className="flex flex-col items-center justify-center h-64 text-yellow-500">
                       <FiAlertTriangle className="text-4xl mb-4" />
                       <p className="font-semibold">Jenis alat '{selectedDevice.jenis}' tidak dikenali.</p>
                   </div>
                );
        }
    };
    
    const containerVariants = { 
      hidden: { opacity: 0 }, 
      visible: { 
        opacity: 1, 
        transition: { staggerChildren: 0.1 } 
      } 
    };

    return (
        <MainLayout className="relative flex bg-gray-100 min-h-screen">
            <div className="flex-1 flex flex-col">
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-3 md:p-6">
                    {/* Header dengan Dropdown */}
                    <div className="mb-6 md:mb-8">
                        <div className="relative max-w-xs">
                            <FiHardDrive className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400" />
                            <select
                                value={selectedDeviceId}
                                onChange={handleDeviceChange}
                                disabled={devices.length === 0}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none font-semibold text-gray-700"
                            >
                                {devices.length > 0 ? (
                                    devices.map((device) => (
                                        <option key={device.id} value={device.id}>
                                            {device.nama}
                                        </option>
                                    ))
                                ) : (
                                    <option>Tidak ada alat</option>
                                )}
                            </select>
                        </div>
                    </div>
                    
                    {/* Konten Dinamis */}
                    <motion.div variants={containerVariants} initial="hidden" animate="visible">
                        {renderContent()}
                    </motion.div>
                </main>
            </div>
        </MainLayout>
    );
};

export default DashboardPage;