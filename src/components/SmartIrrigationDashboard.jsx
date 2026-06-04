// src/components/SmartIrrigationDashboard.jsx

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiCpu, FiWifi, FiTerminal, FiClock, FiPower, FiToggleRight, FiDroplet, FiSearch, FiRefreshCw, FiWifiOff, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { FaServer } from 'react-icons/fa';
import api from '../api';
import { BsFiletypeCsv, BsFiletypeXlsx, BsTable } from 'react-icons/bs';
import { toast } from 'react-hot-toast';
import { io } from 'socket.io-client';


const LogTable = ({ data, isLoading, searchKeyword }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // Menampilkan 10 item per halaman

    // Reset halaman ke 1 jika keyword pencarian berubah
    useEffect(() => {
        setCurrentPage(1);
    }, [searchKeyword]);

    // Logic Pagination Client-Side
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = data.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(data.length / itemsPerPage);

    const onPageChange = (pageNumber) => setCurrentPage(pageNumber);

    const renderPaginationButtons = () => {
        if (totalPages <= 1) return null;
        let buttons = [];
        
        // Tombol Previous
        buttons.push(
            <button
                key="prev"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
                <FiChevronLeft className="h-5 w-5" />
            </button>
        );

        // Logic Angka Halaman
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                buttons.push(
                    <button
                        key={i}
                        onClick={() => onPageChange(i)}
                        className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${
                            i === currentPage
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        {i}
                    </button>
                );
            } else if (i === currentPage - 2 || i === currentPage + 2) {
                buttons.push(<span key={`dots-${i}`} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>);
            }
        }

        // Tombol Next
        buttons.push(
            <button
                key="next"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
                <FiChevronRight className="h-5 w-5" />
            </button>
        );
        return buttons;
    };

    return (
        <div className="flex flex-col">
            <div className="overflow-x-auto -mx-4 sm:mx-0 rounded-lg border border-gray-200">
                <div className="inline-block min-w-full align-middle">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waktu Eksekusi</th>
                                <th scope="col" className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Jadwal</th>
                                <th scope="col" className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                                <th scope="col" className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jam</th>
                                <th scope="col" className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durasi</th>
                                <th scope="col" className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Solenoid</th>
                                <th scope="col" className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Koneksi</th>
                                <th scope="col" className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-10 text-center text-sm text-gray-500">
                                        <div className="flex justify-center items-center gap-2">
                                            <FiRefreshCw className="animate-spin text-blue-500" /> Memuat data log...
                                        </div>
                                    </td>
                                </tr>
                            ) : currentItems.length > 0 ? (
                                currentItems.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-3 md:px-6 py-4 whitespace-nowrap text-xs md:text-sm text-gray-600 font-mono">
                                            {formatTimestamp(log.createdAt || log.timestamp)}
                                        </td>
                                        <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{log.nama}</td>
                                        <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.tanggal}</td>
                                        <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.waktu}</td>
                                        <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.durasi} mnt</td>
                                        <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.solenoid}</td>
                                        <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                                            <StatusBadge status={log.internet === 'Online' ? 'Online' : 'Offline'} />
                                        </td>
                                        <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                                            <LogStatusBadge status={log.status} />
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="px-6 py-10 text-center text-sm text-gray-500">
                                        {searchKeyword ? 'Tidak ada log yang sesuai pencarian.' : 'Belum ada data log.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 0 && (
                <nav className="flex items-center justify-between pt-4" aria-label="Pagination">
                    <div className="hidden sm:block">
                        <p className="text-sm text-gray-700">
                            Menampilkan <span className="font-medium">{indexOfFirstItem + 1}</span> sampai <span className="font-medium">{Math.min(indexOfLastItem, data.length)}</span> dari <span className="font-medium">{data.length}</span> hasil
                        </p>
                    </div>
                    <div className="flex-1 flex justify-between sm:justify-end">
                        <div className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            {renderPaginationButtons()}
                        </div>
                    </div>
                </nav>
            )}
        </div>
    );
};

// --- KOMPONEN DOWNLOAD BUTTON (Tidak Ada Perubahan) ---
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
    // STYLE BARU
    const colorClass = format === 'csv' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700';
    
    return (
        <button 
            onClick={downloadData}
            className={`px-3 py-1.5 md:px-4 md:py-2 text-white rounded-lg font-semibold text-xs md:text-sm flex items-center space-x-2 transition-colors ${colorClass}`}
            title={`Unduh ${format.toUpperCase()}`}
        >
            {format === 'csv' ? <BsFiletypeCsv className="h-4 w-4" /> : <BsFiletypeXlsx className="h-4 w-4" />}
            <span>{format.toUpperCase()}</span>
        </button>
    );
};

// --- KOMPONEN CONTROL SWITCH (Tidak Ada Perubahan) ---
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

// --- KOMPONEN INFO ROW (Tidak Ada Perubahan) ---
const InfoRow = ({ icon, label, value }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
        <div className="flex items-center">
            <div className="text-gray-500 mr-3">{icon}</div>
            <span className="text-sm font-medium text-gray-600">{label}</span>
        </div>
        <span className="text-sm font-bold text-gray-800 truncate">{value}</span>
    </div>
);

// --- KOMPONEN BADGES (Tidak Ada Perubahan) ---
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

// --- FORMATTER TANGGAL (Tidak Ada Perubahan) ---
const formatTimestamp = (isoDate) => {
    if (!isoDate) return 'N/A';
    const date = new Date(isoDate);
    return date.toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'medium',
        timeZone: 'Asia/Jakarta'
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
        // [Kode inisialisasi realtimeDeviceInfo tetap di sini]
        setRealtimeDeviceInfo({
            status: device.status || 'inactive',
            ipAddress: device.ipAddress || 'N/A',
            ssid: device.ssid || 'N/A', 
            firmware: device.firmware || 'N/A'
        });

        // 🔥 LOGIKA UTAMA INISIALISASI KONTROL MANUAL 🔥
        const initialStates = {};
        
        // Cek apakah device.solenoidCount ada (Asumsi ini > 0)
        const count = device.solenoidCount || 6; // Gunakan default 6 jika count tidak ada di props
        
        // 1. Iterasi berdasarkan count untuk menentukan JUMLAH tombol
        for (let i = 1; i <= count; i++) {
            const key = `solenoid${i}`;
            let stateFromDB = false;
            
            // 2. Cek status persisten dari DB melalui manualControl (jika ada)
            if (device.manualControl && device.manualControl[key]) {
                stateFromDB = device.manualControl[key] === 'ON'; 
            }
            
            initialStates[key] = stateFromDB;
        }
        
        // 3. Set State Pompa
        // Gunakan device.pumpState jika manualControl tidak ada (opsional)
        setPumpState(device.manualControl?.pump === 'ON' || device.pumpState === 'ON' || false);
        
        // 4. Set State Solenoid
        setSolenoidStates(initialStates);

        console.log("[DEBUG] Status manual diinisialisasi dari props:", initialStates);
        
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, [device]);

    // --- 2. FETCH LOGS FUNCTION ---
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

                // --- PERUBAHAN UTAMA DI SINI: Sorting menggunakan createdAt ---
                // Sort logs terbaru di atas (descending by createdAt)
                logsAlatIni.sort((a, b) => new Date(b.createdAt || b.timestamp) - new Date(a.createdAt || a.timestamp));

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

    // --- 3. TRIGGER FETCH LOGS ON MOUNT (Tidak Ada Perubahan) ---
    useEffect(() => {
        fetchLogs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [device?.id, device?.macAddress]);

    // --- 4. SOCKET.IO CONNECTION (Tidak Ada Perubahan) ---
    useEffect(() => {
        if (!device?.id) return;

        const socketUrl = 'http://37.44.244.108:5173'; // GANTI SESUAI URL BACKEND ANDA
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

        // Listener BARU: Update Status Kontrol Manual
        socket.on('manual_state_update', (data) => {
            if (data.deviceId === device.id) {
                console.log("⚡ Realtime Manual State Diterima:", data);
                // Contoh format data: { deviceId: 1, solenoid1: 'ON', solenoid2: 'OFF', pump: 'ON' }
                
                const newSolenoidStates = { ...solenoidStates };
                let pump = pumpState;

                Object.keys(data).forEach(key => {
                    if (key.startsWith('solenoid')) {
                        newSolenoidStates[key] = data[key] === 'ON';
                    } else if (key === 'pump') {
                        pump = data[key] === 'ON';
                    }
                });
                
                setSolenoidStates(newSolenoidStates);
                setPumpState(pump);

                toast('Kontrol Manual diperbarui secara realtime.', { id: 'manual-update-toast' });
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


    // --- FUNGSI UNTUK MENGIRIM PERINTAH MANUAL (Tidak Ada Perubahan) ---
    const sendManualCommand = async (payload, revertStateCallback) => {
        try {
            const commandPayload = {
                ...payload,
                macAddress: device.macAddress,
                deviceId: device.id,
            };

            await api.post(`/alat/${device.id}/manual`, commandPayload, { withCredentials: true });
            console.log(`Perintah manual berhasil dikirim:`, commandPayload);
            toast.success("Perintah terkirim ke alat");
        } catch (error) {
            console.error("Gagal mengirim perintah manual:", error);
            revertStateCallback();
            toast.error("Gagal mengirim perintah. Cek koneksi alat.");
        }
    };

    // Handler untuk Solenoid (Tidak Ada Perubahan)
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

    // Handler untuk Pompa (Tidak Ada Perubahan)
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

    // Filtering Logic (Tidak Ada Perubahan)
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
            log.internet?.toLowerCase().includes(searchLower) ||
            log.createdAt?.toLowerCase().includes(searchLower) // Tambahkan createdAt ke pencarian
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
            {/* 1. Informasi Alat (Tidak Ada Perubahan) */}
            <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-lg">
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-3">Informasi Alat</h3>
                <div className="space-y-2">
                    <InfoRow icon={<FiCpu />} label="Nama Alat" value={device.nama} />
                    <InfoRow icon={<FiTerminal />} label="MAC Address" value={device.macAddress} />
                    <InfoRow icon={<FaServer />} label="IP Address" value={realtimeDeviceInfo.ipAddress} />
                    <InfoRow icon={<FiWifi />} label="SSID" value={realtimeDeviceInfo.ssid} />
                    
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

            {/* 2. Kontrol Manual (Tidak Ada Perubahan) */}
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
                            label={`Baris  ${index + 1}`}
                            isOn={solenoidStates[key]}
                            onToggle={() => handleSolenoidToggle(key)}
                        />
                    ))}
                </div>
            </motion.div>

            {/* 3. BLOK JADWAL (Tidak Ada Perubahan) */}
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
                        <DownloadButton data={filteredLogs} filename="log-jadwal" format="csv" />
                        <DownloadButton data={filteredLogs} filename="log-jadwal" format="xlsx" />
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

                <LogTable 
                    data={filteredLogs}
                    isLoading={isLoadingLogs}
                    searchKeyword={searchLogs}
                />
                
            </motion.div>
        </div>
    );
};

export default SmartIrrigationDashboard;
