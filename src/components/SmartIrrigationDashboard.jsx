// src/components/SmartIrrigationDashboard.jsx

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiCpu, FiWifi, FiTerminal, FiClock, FiPower, FiToggleRight, FiDroplet, FiSearch, FiRefreshCw, FiWifiOff } from 'react-icons/fi';
import { FaServer } from 'react-icons/fa';
import api from '../api';
import { BsFiletypeCsv, BsFiletypeXlsx, BsTable } from 'react-icons/bs';
import { toast } from 'react-hot-toast';
import { io } from 'socket.io-client';

// --- KOMPONEN DOWNLOAD BUTTON ---
const DownloadButton = ({ data, filename, format }) => {
    const downloadData = () => {
        let csvContent = '';

        // Jika format CSV
        if (format === 'csv') {
            if (data.length > 0) {
                const headers = Object.keys(data[0]);
                csvContent = headers.join(',') + '\n';
                data.forEach(item => {
                    const row = headers.map(header => {
                        let value = item[header];
                        if (Array.isArray(value)) {
                            value = `"${value.join(';')}"`;
                        } else if (typeof value === 'string' && value.includes(',')) {
                            value = `"${value}"`;
                        } else if (value === null || value === undefined) {
                            value = '';
                        }
                        return value;
                    }).join(',');
                    csvContent += row + '\n';
                });
            }
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.setAttribute('download', `${filename}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } 
        // Jika format Excel
        else if (format === 'xlsx') {
            import('xlsx').then(XLSX => {
                const worksheet = XLSX.utils.json_to_sheet(data);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
                XLSX.writeFile(workbook, `${filename}.xlsx`);
            }).catch(err => {
                toast.error('Gagal mengunduh file Excel. Pastikan library xlsx tersedia.');
                console.error('Error loading xlsx library:', err);
            });
        }
    };

    return (
        <button 
            onClick={downloadData}
            className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors flex items-center text-sm"
            title={`Unduh dalam format ${format.toUpperCase()}`}
        >
            {format === 'csv' ? <BsFiletypeCsv className="mr-1" /> : <BsFiletypeXlsx className="mr-1" />}
            {format.toUpperCase()}
        </button>
    );
};

// --- KOMPONEN CONTROL SWITCH ---
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

// --- KOMPONEN INFO ROW ---
const InfoRow = ({ icon, label, value }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
        <div className="flex items-center">
            <div className="text-gray-500 mr-3">{icon}</div>
            <span className="text-sm font-medium text-gray-600">{label}</span>
        </div>
        <span className="text-sm font-bold text-gray-800 truncate">{value}</span>
    </div>
);

// --- KOMPONEN BADGES ---
const StatusBadge = ({ status }) => {
    const isActive = status === 'active' || status === 'Online';
    return (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
            {isActive ? 'Online' : 'Offline'}
        </span>
    );
};

const LogStatusBadge = ({ status }) => {
    const isSuccess = status === 'SUCCESS';
    const statusClass = isSuccess 
        ? 'bg-green-100 text-green-700' 
        : 'bg-red-100 text-red-700';

    return (
        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusClass}`}>
            {status}
        </span>
    );
};

// --- FORMATTER TANGGAL ---
const formatTimestamp = (isoDate) => {
    if (!isoDate) return 'N/A';
    const date = new Date(isoDate);
    return date.toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'medium'
    });
};

// ==========================================
// MAIN COMPONENT STARTS HERE
// ==========================================
const SmartIrrigationDashboard = ({ device, isLoading }) => {

    const [searchJadwal, setSearchJadwal] = useState('');

    const alatTableRef = useRef(null);
    const jadwalTableRef = useRef(null);
    const [scheduleLogs, setScheduleLogs] = useState([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(true);
    const [searchLogs, setSearchLogs] = useState('');
    const logTableRef = useRef(null);

    const [realtimeDeviceInfo, setRealtimeDeviceInfo] = useState({
        status: 'inactive', // default offline
        ipAddress: 'N/A',
        ssid: 'N/A',
        firmware: 'N/A'
    });
        
    // State untuk kontrol manual
    const [solenoidStates, setSolenoidStates] = useState({
        solenoid1: false, solenoid2: false, solenoid3: false,
        solenoid4: false, solenoid5: false, solenoid6: false
    });
    const [pumpState, setPumpState] = useState(false);

    // --- 1. INITIALIZATION EFFECT (Runs when 'device' props change) ---
    useEffect(() => {
        if (device) {
            // Isi state awal dari props device
            setRealtimeDeviceInfo({
                status: device.status || 'inactive',
                ipAddress: device.ipAddress || 'N/A',
                ssid: device.ssid || 'N/A', 
                firmware: device.firmware || 'N/A'
            });

            // Set jumlah solenoid state awal
            if (device.solenoidCount) {
                const initialStates = {};
                for (let i = 1; i <= device.solenoidCount; i++) {
                    initialStates[`solenoid${i}`] = false;
                }
                setSolenoidStates(initialStates);
            }
        }
    }, [device]);

    // --- 2. FETCH LOGS FUNCTION ---
    // Didefinisikan di sini agar bisa dipanggil oleh useEffect maupun Socket
    const fetchLogs = async () => {
        if (!device?.id) {
            setIsLoadingLogs(false);
            return;
        }

        setIsLoadingLogs(true);
        try {
            console.log("[DEBUG] Mengambil log dari endpoint GLOBAL: /logs/schedule");
            
            // Gunakan endpoint yang sesuai kebutuhan Anda
            const response = await api.get(`/logs/schedule`); 
            
            if (Array.isArray(response.data)) {
                // Filter data agar hanya menampilkan log milik alat ini
                const logsAlatIni = response.data.filter(log =>
                    log.macAddress === device.macAddress || log.deviceId === device.id
                );

                // Sort logs terbaru di atas (descending by timestamp)
                logsAlatIni.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

                console.log(`[DEBUG] Ditemukan ${logsAlatIni.length} log untuk alat ini.`);
                setScheduleLogs(logsAlatIni);
            } else {
                console.warn("Data log yang diterima BUKAN array!", response.data);
                setScheduleLogs([]);
            }
        } catch (error) {
            console.error("Error fetching schedule logs:", error);
        } finally {
            setIsLoadingLogs(false);
        }
    };

    // --- 3. TRIGGER FETCH LOGS ON MOUNT ---
    useEffect(() => {
        fetchLogs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [device?.id, device?.macAddress]);

    // --- 4. SOCKET.IO CONNECTION ---
    useEffect(() => {
        if (!device?.id) return;

        const socketUrl = "http://localhost:5000"; // GANTI SESUAI URL BACKEND ANDA
        const socket = io(socketUrl);

        console.log("🔌 Menghubungkan Socket.IO...");

        // Listener: Update Status Device
        socket.on('device_status_update', (data) => {
            if (data.macAddress === device.macAddress) {
                console.log("⚡ Realtime Update Diterima:", data);
                setRealtimeDeviceInfo(prev => ({
                    ...prev,
                    status: 'active',
                    ipAddress: data.ipAddress || prev.ipAddress,
                    ssid: data.ssid || prev.ssid,
                    firmware: data.firmware || prev.firmware
                }));
                toast.success(`Perangkat Online: ${data.ipAddress}`, { id: 'online-toast' });
            }
        });
        
        // Listener: Log Baru (Trigger fetchLogs ulang)
        socket.on('new_log', (newLogData) => {
            if (newLogData.deviceId === device.id) {
                toast("Log aktivitas baru diterima");
                fetchLogs(); 
            }
        });

        return () => {
            socket.disconnect();
            console.log("🔌 Socket.IO Disconnected");
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [device?.id, device?.macAddress]);


    // --- FUNGSI UNTUK MENGIRIM PERINTAH MANUAL ---
    const sendManualCommand = async (payload, revertStateCallback) => {
        try {
            const commandPayload = {
                ...payload,
                macAddress: device.macAddress 
            };

            await api.post(`/devices/${device.id}/manual`, commandPayload, { withCredentials: true });
            console.log(`Perintah manual berhasil dikirim:`, commandPayload);
            toast.success("Perintah terkirim ke alat");
        } catch (error) {
            console.error("Gagal mengirim perintah manual:", error);
            revertStateCallback();
            toast.error("Gagal mengirim perintah. Cek koneksi alat.");
        }
    };

    // Handler untuk Solenoid
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

    // Handler untuk Pompa
    const handlePumpToggle = () => {
        const newState = !pumpState;
        setPumpState(newState); // Update UI optimis
        
        sendManualCommand(
            { target: 'pump', state: newState ? 'ON' : 'OFF' },
            () => setPumpState(!newState) // Revert jika gagal
        );
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
    };

    // Helper variables for render
    const deviceExtraInfo = {
        ipAddress: device?.ipAddress || 'Null',
        connectionType: device?.connectionType || 'Null',
    };
    const daftarJadwal = device?.schedules || [];

    // Filtering Logic
    const filteredJadwal = daftarJadwal.filter(jadwal => 
        jadwal.nama?.toLowerCase().includes(searchJadwal.toLowerCase()) ||
        jadwal.tanggalMulai?.toLowerCase().includes(searchJadwal.toLowerCase()) ||
        jadwal.tanggalSelesai?.toLowerCase().includes(searchJadwal.toLowerCase()) ||
        jadwal.solenoid?.join(', ').toLowerCase().includes(searchJadwal.toLowerCase())
    );

    const filteredLogs = scheduleLogs.filter(log => {
        const searchLower = searchLogs.toLowerCase();
        return (
            log.nama?.toLowerCase().includes(searchLower) ||
            log.tanggal?.toLowerCase().includes(searchLower) ||
            log.waktu?.toLowerCase().includes(searchLower) ||
            log.solenoid?.toLowerCase().includes(searchLower) ||
            log.status?.toLowerCase().includes(searchLower) ||
            log.internet?.toLowerCase().includes(searchLower)
        );
    });

    // Loading Check
    if (!device) {
        return (
            <div className="flex justify-center items-center p-10">
                <FiRefreshCw className="animate-spin text-blue-500 mr-2" />
                <span>Memuat data alat...</span>
            </div>
        );
    }
    
    // --- RENDER UTAMA ---
    return (
        <div className="grid grid-cols-1 gap-6">
            {/* 1. Informasi Alat */}
            <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-lg">
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-3">Informasi Alat</h3>
                <div className="space-y-2">
                    <InfoRow icon={<FiCpu />} label="Nama Alat" value={device.nama} />
                    <InfoRow icon={<FiTerminal />} label="MAC Address" value={device.macAddress} />
                    <InfoRow icon={<FaServer />} label="IP Address" value={realtimeDeviceInfo.ipAddress} />
                    <InfoRow icon={<FiWifi />} label="SSID" value={realtimeDeviceInfo.ssid} />
                    <InfoRow icon={<FiWifi />} label="Connection Type" value={deviceExtraInfo.connectionType} />
                    
                    <div className="flex items-center justify-between py-3">
                        <div className="flex items-center">
                            <div className="text-gray-500 mr-3"><FiPower /></div>
                            <span className="text-sm font-medium text-gray-600">Status Koneksi</span>
                        </div>
                        <div className="flex items-center">
                            <span className={`inline-block h-3 w-3 rounded-full mr-2 ${realtimeDeviceInfo.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                            <span className="text-sm font-bold text-gray-800">
                                {realtimeDeviceInfo.status === 'active' ? 'Online' : 'Offline'}
                            </span>
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
                    {/* Tombol Manual untuk Pompa */}
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
                            label={`Solenoid  ${index + 1}`}
                            isOn={solenoidStates[key]}
                            onToggle={() => handleSolenoidToggle(key)}
                        />
                    ))}
                </div>
            </motion.div>

            {/* 3. BLOK JADWAL */}
            <motion.div variants={itemVariants} className="bg-white p-4 md:p-6 rounded-2xl shadow-lg">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b pb-4">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center">
                         <FiClock className="mr-2" /> Jadwal Penyiraman
                    </h2>
                    <div className="flex flex-wrap gap-2 mt-3 sm:mt-0">
                        <DownloadButton 
                            data={filteredJadwal} 
                            filename="daftar-jadwal" 
                            format="csv"
                        />
                        <DownloadButton 
                            data={filteredJadwal} 
                            filename="daftar-jadwal" 
                            format="xlsx"
                        />
                    </div>
                </div>

                <div className="relative w-full sm:w-64 mb-4">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cari jadwal..."
                        value={searchJadwal}
                        onChange={(e) => setSearchJadwal(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div ref={jadwalTableRef} className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm text-left text-gray-600 min-w-full divide-y divide-gray-200">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-4 py-3 sm:px-6">Nama Jadwal</th>
                                <th scope="col" className="px-4 py-3 sm:px-6">Tanggal Mulai</th>
                                <th scope="col" className="px-4 py-3 sm:px-6">Tanggal Selesai</th>
                                <th scope="col" className="px-4 py-3 sm:px-6">Waktu (HH:MM)</th>
                                <th scope="col" className="px-4 py-3 sm:px-6">Durasi (Menit)</th>
                                <th scope="col" className="px-4 py-3 sm:px-6">Solenoid</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {isLoading ? (
                                <tr><td colSpan="6" className="text-center p-4">
                                    <div className="flex justify-center items-center space-x-2">
                                        <FiRefreshCw className="animate-spin text-blue-500" />
                                        <span>Memuat jadwal...</span>
                                    </div>
                                </td></tr>
                            ) : filteredJadwal.length === 0 ? (
                                <tr><td colSpan="6" className="text-center p-4">
                                    {searchJadwal ? 'Tidak ada jadwal yang sesuai dengan pencarian.' : 'Belum ada jadwal yang dibuat.'}
                                </td></tr>
                            ) : (
                                filteredJadwal.map((jadwal) => (
                                    <tr key={jadwal.id} className="bg-white hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 sm:px-6 font-medium text-gray-900">{jadwal.nama || '-'}</td>
                                        <td className="px-4 py-3 sm:px-6">{jadwal.tanggalMulai}</td>
                                        <td className="px-4 py-3 sm:px-6">{jadwal.tanggalSelesai}</td>
                                        <td className="px-4 py-3 sm:px-6">
                                            <div className="max-w-xs overflow-hidden text-ellipsis">
                                                {jadwal.waktu.join(', ')}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 sm:px-6">{jadwal.durasi}</td>
                                        <td className="px-4 py-3 sm:px-6">
                                            <div className="max-w-xs overflow-hidden text-ellipsis">
                                                {jadwal.solenoid.join(', ')}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="mt-2 text-xs text-gray-500 flex items-center">
                    <BsTable className="mr-1" /> 
                    Menampilkan {filteredJadwal.length} dari {daftarJadwal.length} jadwal
                </div>
            </motion.div>

            {/* 4. BLOK TABEL LOG EKSEKUSI */}
            <motion.div variants={itemVariants} className="bg-white p-4 md:p-6 rounded-2xl shadow-lg">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b pb-4">
                    <h2 className="text-xl font-bold text-gray-800">Log Eksekusi Jadwal</h2>
                    <div className="flex flex-wrap gap-2 mt-3 sm:mt-0">
                        <DownloadButton 
                            data={filteredLogs} 
                            filename="log-jadwal" 
                            format="csv"
                        />
                        <DownloadButton 
                            data={filteredLogs} 
                            filename="log-jadwal" 
                            format="xlsx"
                        />
                    </div>
                </div>

                <div className="relative w-full sm:w-64 mb-4">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cari log..."
                        value={searchLogs}
                        onChange={(e) => setSearchLogs(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div ref={logTableRef} className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm text-left text-gray-600 min-w-full divide-y divide-gray-200">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-4 py-3 sm:px-6">Waktu Eksekusi</th>
                                <th scope="col" className="px-4 py-3 sm:px-6">Nama Jadwal</th>
                                <th scope="col" className="px-4 py-3 sm:px-6">Tanggal Terjadwal</th>
                                <th scope="col" className="px-4 py-3 sm:px-6">Jam Pemicu</th>
                                <th scope="col" className="px-4 py-3 sm:px-6">Durasi (mnt)</th>
                                <th scope="col" className="px-4 py-3 sm:px-6">Solenoid</th>
                                <th scope="col" className="px-4 py-3 sm:px-6">Koneksi</th>
                                <th scope="col" className="px-4 py-3 sm:px-6">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {isLoadingLogs ? (
                                <tr><td colSpan="8" className="text-center p-4">
                                    <div className="flex justify-center items-center space-x-2">
                                        <FiRefreshCw className="animate-spin text-blue-500" />
                                        <span>Memuat log...</span>
                                    </div>
                                </td></tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr><td colSpan="8" className="text-center p-4">
                                    {searchLogs ? 'Tidak ada log yang sesuai dengan pencarian.' : 'Belum ada log eksekusi.'}
                                </td></tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="bg-white hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 sm:px-6 font-mono text-xs">{formatTimestamp(log.timestamp)}</td>
                                        <td className="px-4 py-3 sm:px-6 font-medium text-gray-900">{log.nama}</td>
                                        <td className="px-4 py-3 sm:px-6">{log.tanggal}</td>
                                        <td className="px-4 py-3 sm:px-6">{log.waktu}</td>
                                        <td className="px-4 py-3 sm:px-6">{log.durasi}</td>
                                        <td className="px-4 py-3 sm:px-6">{log.solenoid}</td>
                                        <td className="px-4 py-3 sm:px-6">
                                            <StatusBadge status={log.internet === 'Online' ? 'active' : 'inactive'} />
                                        </td>
                                        <td className="px-4 py-3 sm:px-6">
                                            <LogStatusBadge status={log.status} />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="mt-2 text-xs text-gray-500 flex items-center">
                    <BsTable className="mr-1" /> 
                    Menampilkan {filteredLogs.length} dari {scheduleLogs.length} log
                </div>
            </motion.div>
        </div>
    );
};

export default SmartIrrigationDashboard;