import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import io from 'socket.io-client';
import toast, { Toaster } from 'react-hot-toast';
import api from '../api';
import MainLayout from '../components/MainLayout';

// Terhubung ke server Socket.IO
const socket = io('http://localhost:5000');

// Komponen kecil untuk badge status agar lebih rapi
const StatusBadge = ({ status }) => {
    const statusInfo = {
        active: { text: 'Online', textColor: 'text-green-700', bgColor: 'bg-green-100' },
        inactive: { text: 'Offline', textColor: 'text-red-700', bgColor: 'bg-red-100' }
    };
    const currentStatus = statusInfo[status] || { text: 'Unknown', textColor: 'text-gray-700', bgColor: 'bg-gray-100' };

    return (
        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${currentStatus.textColor} ${currentStatus.bgColor}`}>
            {currentStatus.text}
        </span>
    );
};

const MonitoringPage = () => {
    // State baru untuk menyimpan daftar alat
    const [daftarAlat, setDaftarAlat] = useState([]);
    const [daftarJadwal, setDaftarJadwal] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Mengambil data awal untuk ALAT dan JADWAL
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Ambil kedua data secara bersamaan
                const [alatRes, jadwalRes] = await Promise.all([
                    api.get('/alat'),
                    api.get('/jadwal')
                ]);
                setDaftarAlat(alatRes.data);
                setDaftarJadwal(jadwalRes.data);
            } catch (error) {
                toast.error("Gagal memuat data awal.");
                console.error("Gagal fetch data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    // Mendengarkan pembaruan ALAT secara real-time dari Socket.IO
    useEffect(() => {
        socket.on('device-update', (updatedDevice) => {
            setDaftarAlat(prevList => 
                prevList.map(device => 
                    device.id === updatedDevice.id ? updatedDevice : device
                )
            );
        });

        return () => {
            socket.off('device-update');
        };
    }, []);

    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
    const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

    return (
        <MainLayout>
            <Toaster position="top-center" />
            <div className="p-6 md:p-8">
                <motion.div variants={containerVariants} initial="hidden" animate="visible">
                    <motion.h1 variants={itemVariants} className="text-3xl font-bold text-gray-800 mb-8">
                        Monitoring & Jadwal
                    </motion.h1>

                    {/* --- BAGIAN BARU: Tabel untuk Daftar Alat --- */}
                    <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-lg mb-8">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-4">Monitoring Alat Terhubung</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-600">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">Nama Alat</th>
                                        <th scope="col" className="px-6 py-3">Lokasi</th>
                                        <th scope="col" className="px-6 py-3">Status</th>
                                        <th scope="col" className="px-6 py-3">Alamat IP</th>
                                        <th scope="col" className="px-6 py-3">MAC Address</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr><td colSpan="5" className="text-center p-4">Memuat perangkat...</td></tr>
                                    ) : daftarAlat.length === 0 ? (
                                        <tr><td colSpan="5" className="text-center p-4">Belum ada perangkat yang diklaim.</td></tr>
                                    ) : (
                                        daftarAlat.map((alat) => (
                                            <tr key={alat.id} className="bg-white border-b hover:bg-gray-50">
                                                <td className="px-6 py-4 font-medium text-gray-900">{alat.nama}</td>
                                                <td className="px-6 py-4">{alat.lokasi}</td>
                                                <td className="px-6 py-4"><StatusBadge status={alat.status} /></td>
                                                <td className="px-6 py-4 font-mono">{alat.details?.ipAddress || 'N/A'}</td>
                                                <td className="px-6 py-4 font-mono">{alat.macAddress || 'Belum Diklaim'}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>

                    {/* --- Tabel Jadwal (yang sudah ada sebelumnya) --- */}
                    <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-lg">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-4">Semua Jadwal Terdaftar</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-600">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">Nama Jadwal</th>
                                        <th scope="col" className="px-6 py-3">Tanggal Mulai</th>
                                        <th scope="col" className="px-6 py-3">Tanggal Selesai</th>
                                        <th scope="col" className="px-6 py-3">Waktu (HH:MM)</th>
                                        <th scope="col" className="px-6 py-3">Durasi (Menit)</th>
                                        <th scope="col" className="px-6 py-3">Solenoid</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr><td colSpan="6" className="text-center p-4">Memuat jadwal...</td></tr>
                                    ) : daftarJadwal.length === 0 ? (
                                        <tr><td colSpan="6" className="text-center p-4">Belum ada jadwal yang dibuat.</td></tr>
                                    ) : (
                                        daftarJadwal.map((jadwal) => (
                                            <tr key={jadwal.id} className="bg-white border-b hover:bg-gray-50">
                                                <td className="px-6 py-4 font-medium text-gray-900">{jadwal.nama || '-'}</td>
                                                <td className="px-6 py-4">{jadwal.tanggalMulai}</td>
                                                <td className="px-6 py-4">{jadwal.tanggalSelesai}</td>
                                                <td className="px-6 py-4">{jadwal.waktu.join(', ')}</td>
                                                <td className="px-6 py-4">{jadwal.durasi}</td>
                                                <td className="px-6 py-4">{jadwal.solenoid.join(', ')}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </MainLayout>
    );
};

export default MonitoringPage;