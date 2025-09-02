import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import RealtimeApexChart from "../components/RealtimeApexChart";

// --- Komponen Ikon Tren (untuk naik/turun) ---
const TrendIcon = ({ trendType }) => {
  const isUp = trendType === 'up';
  return (
    <svg className={`w-4 h-4 ${isUp ? 'text-green-500' : 'text-red-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      {isUp ? (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 15l7-7 7 7" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
      )}
    </svg>
  );
};

// --- Komponen Kartu Statistik (Desain Baru) ---
const StatCard = ({ icon, title, value, unit, isTextStatus = false }) => {
  return (
    <motion.div
      className="bg-white rounded-2xl shadow-lg p-6 flex items-center justify-between transform transition-all duration-300 hover:-translate-y-1.5"
      whileHover={{ scale: 1.03 }}
    >
      <div>
        <span className="text-gray-500 font-medium">{title}</span>
        <div className="flex items-baseline space-x-2">
          <h2 className={`font-extrabold text-gray-800 my-1 ${isTextStatus ? 'text-2xl' : 'text-4xl'}`}>{value}</h2>
          {!isTextStatus && <span className="text-gray-400 font-medium">{unit}</span>}
        </div>
        {isTextStatus && (
          <div className="flex items-center text-green-500">
            <span className="inline-block h-3 w-3 bg-green-500 rounded-full mr-2"></span>
            <span className="font-semibold">Berjalan Normal</span>
          </div>
        )}
      </div>
      <div className="p-4 rounded-full bg-blue-50">
        {icon}
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
    <div className="bg-white p-6 rounded-2xl shadow-lg">
      <div className="flex justify-between items-center mb-4 border-b pb-4">
        <h2 className="text-xl font-bold text-gray-800">Data Green House</h2>
        <button onClick={handleDownloadCSV} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          <span>Download CSV</span>
        </button>
      </div>
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
  );
};

// --- Komponen Halaman Utama ---
const DashboardPage = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  const statsData = [
    { title: 'Suhu', value: '28.5', unit: '°C', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V4a4 4 0 10-8 0v12a4 4 0 108 0zM13 16a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
    { title: 'Kelembaban', value: '65', unit: '%', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 21a9 9 0 01-9-9c0-5.25 4.5-9.5 4.5-9.5s4.5 4.25 4.5 9.5a9 9 0 01-9 9z" /></svg> },
    { title: 'Intensitas Cahaya', value: '55.000', unit: 'Lux', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m8.66-15.66l-.707.707M4.34 19.66l-.707.707M21 12h-1M4 12H3m15.66 8.66l-.707-.707M4.34 4.34l-.707-.707" /></svg> },
    { title: 'Status Irigasi', value: 'Aktif', isTextStatus: true, icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7" /></svg> },
  ];
 
  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } } };

  return (
    <div className="relative flex bg-gray-100 min-h-screen">
      <Sidebar isOpen={isSidebarOpen} />
      {/* KODE YANG DIPERBAIKI ADA DI BARIS DI BAWAH INI */}
      <div className="flex-1 flex flex-col">
        <Header onMenuClick={toggleSidebar} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
           
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
              {statsData.map((stat, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <StatCard {...stat} />
                </motion.div>
              ))}
            </div>

            <motion.div variants={itemVariants} className="mb-8">
              <div className="bg-white p-6 rounded-2xl shadow-lg">
                <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-4">Grafik Sensor Real-time</h2>
                <RealtimeApexChart />
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <DataTable />
            </motion.div>

          </motion.div>
        </main>
      </div>
      {isSidebarOpen && <div onClick={toggleSidebar} className="fixed inset-0 bg-black opacity-50 z-20 md:hidden"></div>}
    </div>
  );
};

export default DashboardPage;

