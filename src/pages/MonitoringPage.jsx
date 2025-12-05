import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import io from 'socket.io-client';
import toast, { Toaster } from 'react-hot-toast';
import { FiDownload, FiRefreshCw, FiWifi, FiWifiOff, FiSearch, FiFilter } from 'react-icons/fi';
import { BsTable, BsFiletypeCsv, BsFiletypeXlsx } from 'react-icons/bs';
import api from '../api';
import MainLayout from '../components/MainLayout';



// Terhubung ke server Socket.IO
const socket = io(`http://localhost:3020`);

// Komponen kecil untuk badge status agar lebih rapi
const StatusBadge = ({ status }) => {
    const statusInfo = {
        active: { text: 'Online', textColor: 'text-green-700', bgColor: 'bg-green-100', icon: <FiWifi className="inline mr-1" /> },
        inactive: { text: 'Offline', textColor: 'text-red-700', bgColor: 'bg-red-100', icon: <FiWifiOff className="inline mr-1" /> }
    };
    const currentStatus = statusInfo[status] || statusInfo.inactive;

    return (
        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${currentStatus.textColor} ${currentStatus.bgColor} inline-flex items-center`}>
            {currentStatus.icon}
            {currentStatus.text}
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

const DownloadButton = ({ data, filename, format }) => {
    const downloadData = () => {
        let csvContent = '';

        // Jika format CSV
        if (format === 'csv') {
            // Mendapatkan header dari keys objek pertama
            if (data.length > 0) {
                const headers = Object.keys(data[0]);
                csvContent = headers.join(',') + '\n';

                // Menambahkan baris data
                data.forEach(item => {
                    const row = headers.map(header => {
                        // Handle array dan menghindari koma dalam nilai
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

            // Membuat dan mengunduh file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.setAttribute('download', `${filename}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } 
        // Jika format Excel (menggunakan library xlsx yang perlu ditambahkan)
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

// Helper untuk memformat tanggal dari ISO string
const formatTimestamp = (isoDate) => {
    if (!isoDate) return 'N/A';
    const date = new Date(isoDate);
    return date.toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'medium'
    });
};

const MonitoringPage = () => {
    // State untuk menyimpan data
    const [daftarAlat, setDaftarAlat] = useState([]);
    const [daftarJadwal, setDaftarJadwal] = useState([]);
    const [scheduleLogs, setScheduleLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // State untuk pencarian dan filter
    const [searchAlat, setSearchAlat] = useState('');
    const [searchJadwal, setSearchJadwal] = useState('');
    const [searchLogs, setSearchLogs] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    // Ref untuk tabel container (untuk responsif pada perangkat kecil)
    const alatTableRef = useRef(null);
    const jadwalTableRef = useRef(null);
    const logTableRef = useRef(null);

    // Mengambil data awal untuk ALAT dan JADWAL
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Ambil kedua data secara bersamaan
                const [alatRes, jadwalRes, logRes] = await Promise.all([
                    api.get('/alat'),
                    api.get('/jadwal'),
                    api.get('/logs/schedule')
                ]);
                setDaftarAlat(alatRes.data);
                setDaftarJadwal(jadwalRes.data);
                setScheduleLogs(logRes.data);
            } catch (error) {
                toast.error("Gagal memuat data awal.");
                console.error("Gagal fetch data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    // Fungsi untuk refresh data
    const refreshData = async () => {
        setIsRefreshing(true);
        try {
            const [alatRes, jadwalRes, logRes] = await Promise.all([
                api.get('/alat'),
                api.get('/jadwal'),
                api.get('/logs/schedule')
            ]);
            setDaftarAlat(alatRes.data);
            setDaftarJadwal(jadwalRes.data);
            setScheduleLogs(logRes.data);
            toast.success("Data berhasil diperbarui");
        } catch (error) {
            toast.error("Gagal memperbarui data");
            console.error("Gagal refresh data:", error);
        } finally {
            setIsRefreshing(false);
        }
    };

    // Mendengarkan pembaruan ALAT secara real-time dari Socket.IO
    useEffect(() => {
        socket.on('device-update', (updatedDevice) => {
            setDaftarAlat(prevList => 
                prevList.map(device => 
                    device.id === updatedDevice.id ? updatedDevice : device
                )
            );
        });

        // --- TAMBAHAN ---
        // Anda bisa menambahkan socket listener di sini jika backend Anda
        // meng-emit 'new-log' saat log baru masuk.
        // socket.on('new-log', (newLog) => {
        //   // Tambahkan log baru ke atas daftar
        //   setScheduleLogs(prevLogs => [newLog, ...prevLogs]);
        //   // Batasi agar tidak terlalu banyak di memori
        //   setScheduleLogs(prevLogs => prevLogs.slice(0, 100)); 
        //   toast.success("Log baru diterima!");
        // });

        return () => {
            socket.off('device-update');
            // socket.off('new-log');
        };
    }, []);
      // Filter data alat berdasarkan pencarian dan status
    const filteredAlat = daftarAlat.filter(alat => {
        const matchSearch = alat.nama.toLowerCase().includes(searchAlat.toLowerCase()) || 
                           alat.lokasi.toLowerCase().includes(searchAlat.toLowerCase()) ||
                           (alat.ssid && alat.ssid.toLowerCase().includes(searchAlat.toLowerCase())) ||
                           (alat.macAddress && alat.macAddress.toLowerCase().includes(searchAlat.toLowerCase()));

        const matchStatus = filterStatus === 'all' || 
                           (filterStatus === 'active' && alat.status === 'active') || 
                           (filterStatus === 'inactive' && alat.status === 'inactive');

        return matchSearch && matchStatus;
    });

    // Filter data jadwal berdasarkan pencarian
    const filteredJadwal = daftarJadwal.filter(jadwal => 
        jadwal.nama?.toLowerCase().includes(searchJadwal.toLowerCase()) ||
        jadwal.tanggalMulai?.toLowerCase().includes(searchJadwal.toLowerCase()) ||
        jadwal.tanggalSelesai?.toLowerCase().includes(searchJadwal.toLowerCase())
    );

    // Filter data log berdasarkan pencarian
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

    // Animasi
    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
    const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

     return (
        <MainLayout>
            <Toaster position="top-center" />
            <div className="grid grid-cols-1 gap-6">
                <motion.div variants={containerVariants} initial="hidden" animate="visible">

                    {/* --- Tabel untuk Daftar Alat --- */}
                    <motion.div variants={itemVariants} className="bg-white p-4 md:p-6 rounded-2xl shadow-lg mb-6 md:mb-8">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b pb-4">
                            <h2 className="text-xl font-bold text-gray-800">Monitoring Alat Terhubung</h2>
                            <div className="flex flex-wrap gap-2 mt-3 sm:mt-0">
                                <button 
                                    onClick={refreshData} 
                                    disabled={isRefreshing}
                                    className={`px-3 py-1.5 bg-gray-50 rounded-md text-gray-600 hover:bg-gray-100 transition-colors flex items-center text-sm ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <FiRefreshCw className={`mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                                    Refresh
                                </button>
                                <div className="flex gap-2">
                                    <DownloadButton 
                                        data={filteredAlat} 
                                        filename="daftar-alat" 
                                        format="csv"
                                    />
                                    <DownloadButton 
                                        data={filteredAlat} 
                                        filename="daftar-alat" 
                                        format="xlsx"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Search and Filter Bar */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                            <div className="relative w-full sm:w-64">
                                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Cari alat..."
                                    value={searchAlat}
                                    onChange={(e) => setSearchAlat(e.target.value)}
                                    className="pl-10 pr-4 py-2 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <FiFilter className="text-gray-400" />
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">Semua Status</option>
                                    <option value="active">Online</option>
                                    <option value="inactive">Offline</option>
                                </select>
                            </div>
                        </div>

                        {/* Tabel Alat */}
                        <div ref={alatTableRef} className="overflow-x-auto rounded-lg border">
                            <table className="w-full text-sm text-left text-gray-600 min-w-full divide-y divide-gray-200">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-4 py-3 sm:px-6">Nama Alat</th>
                                        <th scope="col" className="px-4 py-3 sm:px-6">Lokasi</th>
                                        <th scope="col" className="px-4 py-3 sm:px-6">Status</th>
                                        <th scope="col" className="px-4 py-3 sm:px-6">SSID WiFi</th>
                                        <th scope="col" className="px-4 py-3 sm:px-6">MAC Address</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {isLoading ? (
                                        <tr><td colSpan="5" className="text-center p-4">
                                            <div className="flex justify-center items-center space-x-2">
                                                <FiRefreshCw className="animate-spin text-blue-500" />
                                                <span>Memuat perangkat...</span>
                                            </div>
                                        </td></tr>
                                    ) : filteredAlat.length === 0 ? (
                                        <tr><td colSpan="5" className="text-center p-4">
                                            {searchAlat || filterStatus !== 'all' 
                                                ? 'Tidak ada perangkat yang sesuai dengan pencarian.' 
                                                : 'Belum ada perangkat yang diklaim.'}
                                        </td></tr>
                                    ) : (
                                        filteredAlat.map((alat) => (
                                            <tr key={alat.id} className="bg-white hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 sm:px-6 font-medium text-gray-900">{alat.nama}</td>
                                                <td className="px-4 py-3 sm:px-6">{alat.lokasi}</td>
                                                <td className="px-4 py-3 sm:px-6"><StatusBadge status={alat.status} /></td>
                                                <td className="px-4 py-3 sm:px-6 font-mono text-xs">{alat.ssid || 'N/A'}</td>
                                                <td className="px-4 py-3 sm:px-6 font-mono text-xs">{alat.macAddress || 'Belum Diklaim'}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-2 text-xs text-gray-500 flex items-center">
                            <BsTable className="mr-1" /> 
                            Menampilkan {filteredAlat.length} dari {daftarAlat.length} perangkat
                        </div>
                    </motion.div>

                    {/* --- Tabel Jadwal --- */}
                    <motion.div variants={itemVariants} className="bg-white p-4 md:p-6 rounded-2xl shadow-lg mb-6 md:mb-8">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b pb-4">
                            <h2 className="text-xl font-bold text-gray-800">Semua Jadwal Terdaftar</h2>
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

                        {/* Search Bar untuk Jadwal */}
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

                        {/* Tabel Jadwal */}
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

                    <motion.div variants={itemVariants} className="bg-white p-4 md:p-6 rounded-2xl shadow-lg">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b pb-4">
                            <h2 className="text-xl font-bold text-gray-800">Log Eksekusi Jadwal</h2>
                            <div className="flex flex-wrap gap-2 mt-3 sm:mt-0">
                                {/* Tombol refresh di sini sudah meng-handle log */}
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

                        {/* Search Bar untuk Log */}
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

                        {/* Tabel Log */}
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
                                    {isLoading ? (
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
                            Menampilkan {filteredLogs.length} dari {scheduleLogs.length} log (maks 100)
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </MainLayout>
    );
};
export default MonitoringPage;