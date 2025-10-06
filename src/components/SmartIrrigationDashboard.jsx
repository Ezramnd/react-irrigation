// src/components/SmartIrrigationDashboard.jsx

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiCpu, FiWifi, FiTerminal, FiClock, FiPower, FiToggleRight, FiDroplet } from 'react-icons/fi';
import { FaServer } from 'react-icons/fa';
import api from '../api';

// Komponen Reusable untuk setiap Switch (bisa untuk solenoid atau pompa)
const ControlSwitch = ({ label, id, isOn, onToggle, icon }) => (
    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
        <div className="flex items-center">
            {icon && <span className="mr-2 text-blue-600">{icon}</span>}
            <span className="font-semibold text-sm text-gray-700">{label}</span>
        </div>
        <label htmlFor={id} className="inline-flex relative items-center cursor-pointer">
            <input 
                type="checkbox" 
                id={id} 
                className="sr-only peer" 
                checked={isOn} 
                onChange={onToggle} 
            />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-400 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
    </div>
);


// Komponen untuk menampilkan satu baris informasi
const InfoRow = ({ icon, label, value }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
        <div className="flex items-center">
            <div className="text-gray-500 mr-3">{icon}</div>
            <span className="text-sm font-medium text-gray-600">{label}</span>
        </div>
        <span className="text-sm font-bold text-gray-800 truncate">{value}</span>
    </div>
);

// Komponen untuk tabel jadwal
const ScheduleTable = ({ schedules }) => (
    <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Mulai - Selesai</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jam Mulai</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durasi (Menit)</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Selenoid</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {schedules && schedules.length > 0 ? schedules.map((schedule) => (
                    <tr key={schedule.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{schedule.tanggalMulai} - {schedule.tanggalSelesai}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{schedule.waktu.join(', ')}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{schedule.durasi}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{schedule.solenoid.join(', ')}</td>
                    </tr>
                )) : (
                    <tr>
                        <td colSpan="4" className="text-center py-4 text-sm text-gray-500">Belum ada jadwal.</td>
                    </tr>
                )}
            </tbody>
        </table>
    </div>
);

const SmartIrrigationDashboard = ({ device }) => {
    // State untuk semua kontrol manual digabung
    const [solenoidStates, setSolenoidStates] = useState({
        solenoid1: false, solenoid2: false, /* solenoid3: false, etc */
    });
    // State terpisah untuk pompa
    const [pumpState, setPumpState] = useState(false);

    // --- FUNGSI BARU UNTUK MENGIRIM PERINTAH MANUAL ---
    const sendManualCommand = async (payload, revertStateCallback) => {
        try {
            await api.post(`/devices/${device.id}/manual`, payload, { withCredentials: true });
            console.log(`Perintah manual berhasil dikirim:`, payload);
        } catch (error) {
            console.error("Gagal mengirim perintah manual:", error.response?.data?.msg || error.message);
            revertStateCallback(); // Kembalikan state UI jika gagal
            alert("Gagal mengirim perintah. Silakan coba lagi.");
        }
    };

    // Handler untuk solenoid (tidak banyak berubah)
    const handleSolenoidToggle = (solenoidKey) => {
        const newState = !solenoidStates[solenoidKey];
        const solenoidId = parseInt(solenoidKey.replace('solenoid', ''), 10);
        
        // Update UI optimis
        setSolenoidStates(prevState => ({ ...prevState, [solenoidKey]: newState }));

        // Kirim perintah
        sendManualCommand(
            { solenoidId: solenoidId, state: newState ? 'ON' : 'OFF' },
            () => setSolenoidStates(prevState => ({ ...prevState, [solenoidKey]: !newState }))
        );
    };

    // --- HANDLER BARU KHUSUS UNTUK POMPA ---
    const handlePumpToggle = () => {
        const newState = !pumpState;

        // Update UI optimis
        setPumpState(newState);

        // Kirim perintah dengan payload untuk pompa
        sendManualCommand(
            { target: 'pump', state: newState ? 'ON' : 'OFF' },
            () => setPumpState(!newState) // Fungsi untuk mengembalikan state jika gagal
        );
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
    };

    const deviceExtraInfo = {
        ipAddress: device.ipAddress || '192.168.1.10',
        ssid: device.ssid || 'HomeWiFi_2.4Ghz',
    };
    
    return (
        <div className="flex flex-col gap-6 md:gap-8">
            {/* 1. Informasi Alat */}
            <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-lg">
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-3">Informasi Alat</h3>
                <div className="space-y-2">
                    <InfoRow icon={<FiCpu />} label="Nama Alat" value={device.nama} />
                    <InfoRow icon={<FiTerminal />} label="MAC Address" value={device.macAddress} />
                    <InfoRow icon={<FaServer />} label="IP Address" value={deviceExtraInfo.ipAddress} />
                    <InfoRow icon={<FiWifi />} label="SSID WiFi" value={deviceExtraInfo.ssid} />
                    <div className="flex items-center justify-between py-3">
                        <div className="flex items-center">
                            <div className="text-gray-500 mr-3"><FiPower /></div>
                            <span className="text-sm font-medium text-gray-600">Status</span>
                        </div>
                        <div className="flex items-center">
                            <span className={`inline-block h-3 w-3 rounded-full mr-2 ${device.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                            <span className="text-sm font-bold text-gray-800">{device.status === 'active' ? 'Online' : 'Offline'}</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* 2. Kontrol Manual */}
             <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-lg">
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-3 flex items-center">
                    <FiToggleRight className="mr-2" /> Kontrol Manual
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {/* --- TAMBAHAN: Tombol Manual untuk Pompa --- */}
                    <ControlSwitch 
                        key="pump"
                        id="pump"
                        label="Pompa Air"
                        isOn={pumpState}
                        onToggle={handlePumpToggle}
                        icon={<FiDroplet size={18} />}
                    />
                    {/* Render semua tombol solenoid */}
                    {Object.keys(solenoidStates).map((key, index) => (
                        <ControlSwitch 
                            key={key}
                            id={key}
                            label={`Selenoid ${index + 1}`}
                            isOn={solenoidStates[key]}
                            onToggle={() => handleSolenoidToggle(key)}
                        />
                    ))}
                </div>
            </motion.div>

            {/* 3. Jadwal Penyiraman */}
            <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-lg">
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-3 flex items-center">
                    <FiClock className="mr-2" /> Jadwal Penyiraman
                </h3>
                <ScheduleTable schedules={device.schedules} />
            </motion.div>
        </div>
    );
};

export default SmartIrrigationDashboard;