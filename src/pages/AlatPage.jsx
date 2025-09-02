import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

// --- Komponen Kartu Alat (Desain Baru) ---
const AlatCard = ({ lokasi, jenis, status }) => {
  const statusInfo = {
    active: { text: 'Active', textColor: 'text-green-600', bgColor: 'bg-green-100' },
    inactive: { text: 'Inactive', textColor: 'text-red-600', bgColor: 'bg-red-100' },
    maintenance: { text: 'Maintenance', textColor: 'text-orange-600', bgColor: 'bg-orange-100' },
  };
  const currentStatus = statusInfo[status] || { text: 'Unknown', textColor: 'text-gray-600', bgColor: 'bg-gray-100' };

  return (
    <motion.div
      className="bg-white rounded-2xl shadow-lg overflow-hidden transform hover:-translate-y-1 transition-all duration-300 cursor-pointer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.03 }}
    >
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-gray-500 text-sm font-medium">{lokasi}</span>
            <h2 className="text-xl font-bold text-gray-800 mt-1">{jenis}</h2>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${currentStatus.textColor} ${currentStatus.bgColor}`}>
            {currentStatus.text}
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-6 py-3">
        <span className="text-blue-600 font-semibold text-sm hover:underline">
          Lihat Detail →
        </span>
      </div>
    </motion.div>
  );
};


// --- Komponen Form (tidak ada perubahan) ---
const FormTambahAlat = ({ onClose, onTambahAlat }) => {
  const [namaAlat, setNamaAlat] = useState('');
  const [jenisAlat, setJenisAlat] = useState('');
  const [lokasiAlat, setLokasiAlat] = useState('');
  const [status, setStatus] = useState('active');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!namaAlat || !jenisAlat || !lokasiAlat) {
      alert('Semua field harus diisi!');
      return;
    }
    onTambahAlat({
      nama: namaAlat,
      jenis: jenisAlat,
      lokasi: lokasiAlat,
      status: status,
    });
    onClose();
  };
 
  const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
  const modalVariants = {
    hidden: { y: "-50px", scale: 0.9, opacity: 0 },
    visible: { y: 0, scale: 1, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 15 } },
    exit: { y: "50px", scale: 0.9, opacity: 0, transition: { duration: 0.2 } },
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      variants={backdropVariants} initial="hidden" animate="visible" exit="hidden" onClick={onClose}>
      <motion.div
        className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-3xl shadow-xl border border-gray-100 w-full max-w-lg relative"
        variants={modalVariants} initial="hidden" animate="visible" exit="exit" onClick={(e) => e.stopPropagation()}>
       
        <div className="flex justify-between items-center mb-6 border-b pb-4 border-gray-200">
          <h2 className="text-3xl font-extrabold text-gray-800">Tambahkan Alat Baru</h2>
          <button onClick={onClose} className="p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-all duration-200 focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
       
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="namaAlat" className="block text-sm font-semibold text-gray-700 mb-1">Nama Alat</label>
            <input type="text" id="namaAlat" value={namaAlat} onChange={(e) => setNamaAlat(e.target.value)}
                   className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-gray-800 placeholder-gray-400 shadow-sm"
                   placeholder="Masukkan nama alat" />
          </div>
          <div>
            <label htmlFor="jenisAlat" className="block text-sm font-semibold text-gray-700 mb-1">Jenis Alat</label>
            <input type="text" id="jenisAlat" value={jenisAlat} onChange={(e) => setJenisAlat(e.target.value)}
                   className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-gray-800 placeholder-gray-400 shadow-sm"
                   placeholder="Contoh: Smart Irrigation" />
          </div>
          <div>
            <label htmlFor="lokasiAlat" className="block text-sm font-semibold text-gray-700 mb-1">Lokasi Alat</label>
            <input type="text" id="lokasiAlat" value={lokasiAlat} onChange={(e) => setLokasiAlat(e.target.value)}
                   className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-gray-800 placeholder-gray-400 shadow-sm"
                   placeholder="Contoh: Sukawening, Dramaga" />
          </div>
          <div className="relative">
            <label htmlFor="status" className="block text-sm font-semibold text-gray-700 mb-1">Status Alat</label>
            <select id="status" value={status} onChange={(e) => setStatus(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-gray-800 shadow-sm appearance-none pr-8">
              <option value="active">Aktif</option>
              <option value="inactive">Tidak Aktif</option>
              <option value="maintenance">Perawatan</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pt-6 px-4 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button" onClick={onClose}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors duration-200 font-semibold shadow-md">
              Batal
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 font-semibold shadow-md">
              Simpan Alat
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};


// --- Komponen Halaman Utama ---
const AlatPage = () => {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const [daftarAlat, setDaftarAlat] = useState([
    { nama: 'Smart Irrigation 1', jenis: 'Smart Irrigation', lokasi: 'Sukawening 1', status: 'active' },
  ]);

  const handleTambahAlat = (alatBaru) => {
    setDaftarAlat([...daftarAlat, alatBaru]);
  };

  return (
    <div className="relative flex bg-gray-100 min-h-screen">
      <Sidebar isOpen={isSidebarOpen} />
      <div className="flex-1 flex flex-col">
        <Header onMenuClick={toggleSidebar} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6"> {/* Menambah padding di main */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"> {/* Menambah gap */}
           
            {daftarAlat.map((alat, index) => (
              <AlatCard
                key={index}
                lokasi={alat.lokasi}
                jenis={alat.jenis}
                status={alat.status}
              />
            ))}

            {/* Tombol Kartu "Tambah Alat" (Desain Baru) */}
            <motion.div
              onClick={() => setIsFormVisible(true)}
              className="bg-slate-50 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-slate-300 text-slate-500 hover:border-blue-500 hover:text-blue-500 cursor-pointer transition-all duration-300"
              whileHover={{ scale: 1.03 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }} // Delay agar muncul setelah kartu lain
            >
              <div className="p-4 bg-slate-200 rounded-full mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              </div>
              <span className="font-semibold text-lg">Tambahkan Alat</span>
            </motion.div>
          </div>
        </main>
      </div>

      {isSidebarOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 bg-black opacity-50 z-20 md:hidden"
        ></div>
      )}

      <AnimatePresence>
        {isFormVisible && (
          <FormTambahAlat
            onClose={() => setIsFormVisible(false)}
            onTambahAlat={handleTambahAlat}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AlatPage;

