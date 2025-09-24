import React, { useState, useEffect } from 'react';
import api from '../api';
import { motion } from 'framer-motion';
import RealtimeApexChart from "../components/RealtimeApexChart";
import MainLayout from '../components/MainLayout';
import { FaThermometerHalf, FaTint, FaSun, FaToggleOn } from 'react-icons/fa';
import { FiDownload } from 'react-icons/fi';
import { BsArrowUp, BsArrowDown } from 'react-icons/bs';

// --- Komponen Ikon Tren (untuk naik/turun) ---
const TrendIcon = ({ trendType }) => {
  const isUp = trendType === 'up';
  return isUp ? (
    <BsArrowUp className="w-4 h-4 text-green-500" />
  ) : (
    <BsArrowDown className="w-4 h-4 text-red-500" />
  );
};

// --- Komponen Kartu Statistik (Desain Baru) ---
const StatCard = ({ icon, title, value, unit, isTextStatus = false }) => {
  return (
    <motion.div
      className="bg-white rounded-2xl shadow-lg p-4 md:p-6 flex items-center justify-between transform transition-all duration-300 hover:-translate-y-1.5"
      whileHover={{ scale: 1.03 }}
    >
      <div>
        <span className="text-gray-500 text-sm md:text-base font-medium">{title}</span>
        <div className="flex items-baseline space-x-2">
         <h2 className={`font-extrabold text-gray-800 my-1 ${isTextStatus ? 'text-xl md:text-2xl' : 'text-2xl md:text-4xl'}`}>{value}</h2>
          {!isTextStatus && <span className="text-gray-400 text-sm md:text-base font-medium">{unit}</span>}
        </div>
        {isTextStatus && (
          <div className="flex items-center text-green-500">
             <span className="inline-block h-2 w-2 md:h-3 md:w-3 bg-green-500 rounded-full mr-2"></span>
            <span className="text-sm md:text-base font-semibold">Berjalan Normal</span>
          </div>
        )}
      </div>
       <div className="p-3 md:p-4 rounded-full bg-blue-50">
        <div className="text-blue-600 text-xl md:text-2xl">
          {icon}
        </div>
      </div>
    </motion.div>
  );
};

// --- Komponen Tabel Data Historis ---
const DataTable = () => {
  // Data dummy untuk log, diurutkan dari yang terbaru
  const logData = [
    { tanggal: '2025-09-02', jam: '11:00', suhu: 28.5, kelembaban: 65, lux: 55000, volume: 150 },
    { tanggal: '2025-09-02', jam: '10:00', suhu: 28.2, kelembaban: 66, lux: 52000, volume: 0 },
    { tanggal: '2025-09-02', jam: '09:00', suhu: 27.8, kelembaban: 68, lux: 48000, volume: 150 },
    { tanggal: '2025-09-01', jam: '17:00', suhu: 29.1, kelembaban: 62, lux: 35000, volume: 0 },
    { tanggal: '2025-09-01', jam: '16:00', suhu: 29.5, kelembaban: 60, lux: 42000, volume: 120 },
  ];

  const handleDownloadCSV = () => {
    const headers = ['Tanggal', 'Jam', 'Suhu (°C)', 'Kelembaban (%)', 'Intensitas Cahaya (Lux)', 'Volume Semprot (mL)'];
    const rows = logData.map(row =>
      [row.tanggal, row.jam, row.suhu, row.kelembaban, row.lux, row.volume].join(',')
    );
   
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
   
    link.setAttribute('href', url);
    link.setAttribute('download', 'laporan_greenhouse.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
   <div className="bg-white p-4 md:p-6 rounded-2xl shadow-lg">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b pb-4">
        <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-3 sm:mb-0">Data Green House</h2>
        <button 
          onClick={handleDownloadCSV} 
          className="px-3 py-1.5 md:px-4 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-xs md:text-sm flex items-center space-x-2">
          <FiDownload className="h-4 w-4" />
          <span>Download CSV</span>
        </button>
      </div>
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-3 md:px-6 py-2 md:py-3 text-left text-xs md:text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Tanggal & Jam
                </th>
                <th scope="col" className="px-3 md:px-6 py-2 md:py-3 text-left text-xs md:text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Suhu
                </th>
                <th scope="col" className="px-3 md:px-6 py-2 md:py-3 text-left text-xs md:text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Kelembaban
                </th>
                <th scope="col" className="px-3 md:px-6 py-2 md:py-3 text-left text-xs md:text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Cahaya (Lux)
                </th>
                <th scope="col" className="px-3 md:px-6 py-2 md:py-3 text-left text-xs md:text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Volume Irigasi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logData.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap">
                    <div className="text-xs md:text-sm font-medium text-gray-900">{row.tanggal}</div>
                    <div className="text-xs text-gray-400">{row.jam}</div>
                  </td>
                  <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm">
                    {row.suhu}°C
                  </td>
                  <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm">
                    {row.kelembaban}%
                  </td>
                  <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm">
                    {row.lux.toLocaleString('id-ID')}
                  </td>
                  <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm">
                    {row.volume} mL
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- Komponen Halaman Utama ---
const DashboardPage = () => {

 const [devices, setDevices] = useState([]); // Menyimpan daftar alat
    const [selectedDeviceId, setSelectedDeviceId] = useState(''); // Menyimpan ID alat yang dipilih
    const [dashboardData, setDashboardData] = useState({ // Menyimpan data detail (suhu, dll.)
        suhu: 'N/A',
        kelembaban: 'N/A',
        cahaya: 'N/A',
        statusIrigasi: 'Unknown'
    });
    const [isLoading, setIsLoading] = useState(true);

     // --- BARU: Mengambil daftar alat untuk dropdown ---
    useEffect(() => {
        const fetchDevices = async () => {
            try {
                const response = await api.get('/alat');
                setDevices(response.data);
                // Otomatis pilih alat pertama jika ada
                if (response.data.length > 0) {
                    setSelectedDeviceId(response.data[0].id);
                } else {
                    setIsLoading(false); // Selesai loading jika tidak ada alat
                }
            } catch (error) {
                console.error("Gagal memuat daftar alat:", error);
                setIsLoading(false);
            }
        };
        fetchDevices();
    }, []); // <-- Array kosong agar hanya berjalan sekali

    // --- BARU: Mengambil data detail setiap kali dropdown berubah ---
    useEffect(() => {
        if (!selectedDeviceId) return; // Jangan lakukan apa-apa jika tidak ada alat dipilih

        const fetchDashboardData = async () => {
            setIsLoading(true);
            try {
                // TODO: Nantinya, panggil API Anda di sini
                // const response = await api.get(`/dashboard-data/${selectedDeviceId}`);
                // setDashboardData(response.data);

                // --- Simulasi pengambilan data ---
                console.log(`Mengambil data untuk alat ID: ${selectedDeviceId}`);
                const dummyData = {
                    suhu: (25 + Math.random() * 5).toFixed(1),
                    kelembaban: Math.floor(60 + Math.random() * 15),
                    cahaya: Math.floor(50000 + Math.random() * 10000),
                    statusIrigasi: Math.random() > 0.5 ? 'Aktif' : 'Nonaktif',
                };
                setTimeout(() => { // Simulasi jeda jaringan
                    setDashboardData(dummyData);
                    setIsLoading(false);
                }, 300);
                // -----------------------------

            } catch (error) {
                console.error("Gagal memuat data dashboard:", error);
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, [selectedDeviceId]);

  const statsData = [
    { 
      title: 'Suhu', 
      value: '28.5', 
      unit: '°C', 
      icon: <FaThermometerHalf size={24} />
    },
    { 
      title: 'Kelembaban', 
      value: '65', 
      unit: '%', 
      icon: <FaTint size={24} />
    },
    { 
      title: 'Intensitas Cahaya', 
      value: '55.000', 
      unit: 'Lux', 
      icon: <FaSun size={24} />
    },
    { 
      title: 'Status Irigasi', 
      value: 'Aktif', 
      isTextStatus: true, 
      icon: <FaToggleOn size={24} />
    },
  ];
 
  const containerVariants = { 
    hidden: { opacity: 0 }, 
    visible: { 
      opacity: 1, 
      transition: { staggerChildren: 0.1 } 
    } 
  };

  const itemVariants = { 
    hidden: { y: 20, opacity: 0 }, 
    visible: { 
      y: 0, 
      opacity: 1, 
      transition: { type: 'spring', stiffness: 100 } 
    } 
  };

 return (
    <MainLayout className="relative flex bg-gray-100 min-h-screen">  
      <div className="flex-1 flex flex-col">
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-3 md:p-6">
          <motion.div variants={containerVariants} initial="hidden" animate="visible">

            {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 mb-6 md:mb-8">
              {statsData.map((stat, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <StatCard {...stat} />
                </motion.div>
              ))}
            </div>

            <motion.div variants={itemVariants} className="mb-6 md:mb-8">
              <div className="bg-white p-4 md:p-6 rounded-2xl shadow-lg">
                <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4 border-b pb-4">Grafik Sensor Real-time</h2>
                <RealtimeApexChart />
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <DataTable />
            </motion.div> */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Dashboard</h1>
                        {devices.length > 0 && (
                            <div className="flex items-center gap-2 mt-3 sm:mt-0">
                                <label htmlFor="device-select" className="text-sm font-medium text-gray-600">Alat:</label>
                                <select 
                                    id="device-select"
                                    value={selectedDeviceId} 
                                    onChange={(e) => setSelectedDeviceId(e.target.value)}
                                    className="w-48 p-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                                >
                                    {devices.map(device => (
                                        <option key={device.id} value={device.id}>
                                            {device.nama}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* --- DIUBAH: Tampilan data menjadi dinamis --- */}
                    {isLoading ? <p>Memuat data...</p> : !dashboardData ? <p>Silakan tambahkan alat terlebih dahulu.</p> : (
                        <>
                            {/* Kartu Statistik */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 mb-6 md:mb-8">
                                <StatCard title="Suhu" value={dashboardData.suhu} unit="°C" icon={<FaThermometerHalf />} />
                                <StatCard title="Kelembaban" value={dashboardData.kelembaban} unit="%" icon={<FaTint />} />
                                <StatCard title="Intensitas Cahaya" value={dashboardData.cahaya.toLocaleString('id-ID')} unit="Lux" icon={<FaSun />} />
                                <StatCard title="Status Irigasi" value={dashboardData.statusIrigasi} isTextStatus={true} icon={<FaToggleOn />} />
                            </div>

                            {/* Grafik & Tabel */}
                            <div className="space-y-8">
                                <div className="bg-white p-4 md:p-6 rounded-2xl shadow-lg">
                                    <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4 border-b pb-4">Grafik Sensor Real-time</h2>
                                    <RealtimeApexChart />
                                </div>
                                <DataTable />
                            </div>
                        </>
                    )}
          </motion.div>
        </main>
      </div>
    </MainLayout>
  );
};

export default DashboardPage;