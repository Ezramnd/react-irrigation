import React from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import RealtimeApexChart from "../components/RealtimeApexChart";
import DownloadableIrrigationTable from '../components/DownloadableIrrigationTable';

const DashboardPage = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header />

        {/* Dashboard Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4">
          {/* Bagian Statistik Kartu */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg shadow-sm flex items-center justify-between">
              <div>
                <span className="text-gray-500 text-sm font-medium">Customers</span>
                <h2 className="text-3xl font-bold text-gray-800">3,782</h2>
                <div className="text-green-500 text-sm font-medium flex items-center">
                  <span className="inline-block h-3 w-3 bg-green-500 rounded-full mr-1"></span>
                  11.01%
                </div>
              </div>
              <div className="p-3 bg-gray-100 rounded-full text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 00-3-3.87" />
                  <path d="M16 3.13a4 4 0 010 7.75" />
                </svg>
              </div>
            </div>
            {/* Tambahkan kartu lain di sini */}
            <div className="bg-white p-6 rounded-lg shadow-sm flex items-center justify-between">
              <div>
                <span className="text-gray-500 text-sm font-medium">Orders</span>
                <h2 className="text-3xl font-bold text-gray-800">5,359</h2>
                <div className="text-red-500 text-sm font-medium flex items-center">
                  <span className="inline-block h-3 w-3 bg-red-500 rounded-full mr-1"></span>
                  9.05%
                </div>
              </div>
              <div className="p-3 bg-gray-100 rounded-full text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6L18 2H6z" />
                  <path d="M3 6h18" />
                  <path d="M16 10a4 4 0 01-8 0" />
                </svg>
              </div>
            </div>
            {/* Tambahkan kartu lainnya */}
          </div>

          {/* Bagian Real-time Smart Irrigation*/}
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Real-time Smart Irrigation</h2>
            {/* Panggil komponen chart Anda di sini */}
            <RealtimeApexChart />
          </div>

          {/* Bagian Monthly Target */}
          <div className="mb-6">
            {/* Panggil komponen tabel baru dengan data yang sudah diproses */}
            <DownloadableIrrigationTable history={RealtimeApexChart} />
          </div>

        </main>
      </div>
    </div>
  );
};

export default DashboardPage;