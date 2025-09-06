import React, { useState } from 'react';
import Sidebar from './Sidebar'; // Sesuaikan path jika perlu
import Header from './Header';   // Sesuaikan path jika perlu

// Komponen Layout ini menerima 'children', yaitu konten spesifik dari setiap halaman
const MainLayout = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  return (
    // Ini adalah struktur layout utama yang sudah diperbaiki
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} />
      
      {/* Wrapper untuk konten utama (Header + Main) */}
      <div className="flex-1 flex flex-col">
        <Header onMenuClick={toggleSidebar} />
        
        {/* Di sinilah konten halaman yang berbeda-beda akan ditampilkan */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          {children}
        </main>
      </div>

      {/* Overlay untuk mobile */}
      {isSidebarOpen && <div onClick={toggleSidebar} className="fixed inset-0 bg-black opacity-50 z-20 md:hidden"></div>}
    </div>
  );
};

export default MainLayout;