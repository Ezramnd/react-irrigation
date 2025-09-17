import React from 'react';
import { motion } from 'framer-motion';
import { FaThermometerHalf, FaTint, FaSun, FaToggleOn, FaDownload, FaChevronUp, FaChevronDown } from 'react-icons/fa';
import RealtimeApexChart from "../components/RealtimeApexChart";
import MainLayout from '../components/MainLayout';

// --- Komponen Ikon Tren (untuk naik/turun) ---
const TrendIcon = ({ trendType }) => {
  const isUp = trendType === 'up';
  return isUp ? (
    <FaChevronUp className="w-4 h-4 text-green-500" />
  ) : (
    <FaChevronDown className="w-4 h-4 text-red-500" />
  );
};

// --- Komponen Kartu Statistik (Desain Responsif) ---
const StatCard = ({ icon, title, value, unit, isTextStatus = false }) => {
  return (
    <motion.div
      className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between transform transition-all duration-300 hover:-translate-y-1.5"
      whileHover={{ scale: 1.03 }}
    >
      <div className="flex-1 mb-3 sm:mb-0">
        <span className="text-gray-500 font-medium text-sm sm:text-base">{title}</span>
        <div className="flex items-baseline space-x-2 mt-1">
          <h2 className={`font-extrabold text-gray-800 ${isTextStatus ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-4xl'}`}>{value}</h2>
          {!isTextStatus && <span className="text-gray-400 font-medium text-sm sm:text-base">{unit}</span>}
        </div>
        {isTextStatus && (
          <div className="flex items-center text-green-500 mt-1">
            <span className="inline-block h-3 w-3 bg-green-500 rounded-full mr-2"></span>
            <span className="font-semibold text-sm sm:text-base">Berjalan Normal</span>
          </div>
        )}
      </div>
      <div className="p-3 sm:p-4 rounded-full bg-blue-50 self-end sm:self-auto">
        {icon}
      </div>
    </motion.div>
  );
};

// --- Komponen Tabel Data Historis (Mobile-Responsive) ---
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
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b pb-4 space-y-3 sm:space-y-0">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800">Data Green House</h2>
        <button 
          onClick={handleDownloadCSV} 
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm flex items-center justify-center space-x-2"
        >
          <FaDownload className="h-4 w-4 sm:h-5 sm:w-5" />
          <span>Download CSV</span>
        </button>
      </div>
      
      {/* Mobile Card View */}
      <div className="block md:hidden space-y-4">
        {logData.map((row, index) => (
          <div key={index} className="bg-gray-50 rounded-lg p-4 border">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-gray-900">{row.tanggal}</span>
              <span className="text-gray-500 text-sm">{row.jam}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Suhu:</span>
                <span className="ml-1 font-medium">{row.suhu}°C</span>
              </div>
              <div>
                <span className="text-gray-500">Kelembaban:</span>
                <span className="ml-1 font-medium">{row.kelembaban}%</span>
              </div>
              <div>
                <span className="text-gray-500">Cahaya:</span>
                <span className="ml-1 font-medium">{row.lux.toLocaleString('id-ID')}</span>
              </div>
              <div>
                <span className="text-gray-500">Volume:</span>
                <span className="ml-1 font-medium">{row.volume} mL</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">Tanggal & Jam</th>
                <th scope="col" className="px-6 py-3">Suhu</th>
                <th scope="col" className="px-6 py-3">Kelembaban</th>
                <th scope="col" className="px-6 py-3">Cahaya (Lux)</th>
                <th scope="col" className="px-6 py-3">Volume Irigasi</th>
              </tr>
            </thead>
            <tbody>
              {logData.map((row, index) => (
                <tr key={index} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{row.tanggal} <span className="text-gray-400">{row.jam}</span></td>
                  <td className="px-6 py-4">{row.suhu}°C</td>
                  <td className="px-6 py-4">{row.kelembaban}%</td>
                  <td className="px-6 py-4">{row.lux.toLocaleString('id-ID')}</td>
                  <td className="px-6 py-4">{row.volume} mL</td>
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

  const statsData = [
    { title: 'Suhu', value: '28.5', unit: '°C', icon: <FaThermometerHalf className="h-7 w-7 text-blue-600" /> },
    { title: 'Kelembaban', value: '65', unit: '%', icon: <FaTint className="h-7 w-7 text-blue-600" /> },
    { title: 'Intensitas Cahaya', value: '55.000', unit: 'Lux', icon: <FaSun className="h-7 w-7 text-blue-600" /> },
    { title: 'Status Irigasi', value: 'Aktif', isTextStatus: true, icon: <FaToggleOn className="h-7 w-7 text-blue-600" /> },
  ];
 
  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } } };

  return (
    <MainLayout className="relative flex bg-gray-100 min-h-screen">  
      {/* Responsive Layout */}
      <div className="flex-1 flex flex-col">
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-6">
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
           
            {/* Responsive Grid for Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
              {statsData.map((stat, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <StatCard {...stat} />
                </motion.div>
              ))}
            </div>

            {/* Chart Section */}
            <motion.div variants={itemVariants} className="mb-6 sm:mb-8">
              <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 border-b pb-4">Grafik Sensor Real-time</h2>
                <RealtimeApexChart />
              </div>
            </motion.div>

            {/* Data Table Section */}
            <motion.div variants={itemVariants}>
              <DataTable />
            </motion.div>

          </motion.div>
        </main>
      </div>
    </MainLayout>
  );
};

export default DashboardPage;