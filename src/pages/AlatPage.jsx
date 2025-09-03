import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
// BARU: Import toast untuk notifikasi
import toast, { Toaster } from 'react-hot-toast';

// Asumsi Sidebar dan Header ada di path yang benar
import Sidebar from '../components/Sidebar'; 
import Header from '../components/Header';

// --- Komponen Kartu Alat (Tidak berubah) ---
const AlatCard = ({ alat, onClick }) => { 
  const { lokasi, jenis, status } = alat;
  const statusInfo = { active: { text: 'Active', textColor: 'text-green-600', bgColor: 'bg-green-100' }, inactive: { text: 'Inactive', textColor: 'text-red-600', bgColor: 'bg-red-100' }, maintenance: { text: 'Maintenance', textColor: 'text-orange-600', bgColor: 'bg-orange-100' } };
  const currentStatus = statusInfo[status] || { text: 'Unknown', textColor: 'text-gray-600', bgColor: 'bg-gray-100' };
  return (
    <motion.div layout layoutId={`card-container-${alat.id}`} className="bg-white rounded-2xl shadow-lg overflow-hidden transform hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col min-h-[180px]" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onClick} >
      <div className="p-6 flex-grow"><div className="flex justify-between items-start"><div><span className="text-gray-500 text-sm font-medium">{lokasi}</span><h2 className="text-xl font-bold text-gray-800 mt-1">{jenis}</h2></div><div className={`px-3 py-1 rounded-full text-xs font-semibold ${currentStatus.textColor} ${currentStatus.bgColor}`}>{currentStatus.text}</div></div></div>
      <div className="bg-gray-50 px-6 py-3 mt-auto"><span className="text-blue-600 font-semibold text-sm hover:underline">Lihat Detail →</span></div>
    </motion.div>
  );
};

// --- Komponen Form Tambah Alat (MODIFIKASI: Validasi & Notifikasi) ---
const FormTambahAlat = ({ onClose, onTambahAlat }) => {
    const [namaAlat, setNamaAlat] = useState('');
    const [jenisAlat, setJenisAlat] = useState('');
    const [lokasiAlat, setLokasiAlat] = useState('');
    const [status, setStatus] = useState('active');

    const handleSubmit = (e) => {
      e.preventDefault();
      if (!namaAlat.trim() || !jenisAlat.trim() || !lokasiAlat.trim()) {
        toast.error('Semua field wajib diisi!');
        return;
      }
      onTambahAlat({ nama: namaAlat, jenis: jenisAlat, lokasi: lokasiAlat, status: status });
      toast.success('Alat baru berhasil ditambahkan!');
      onClose();
    };

    const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
    const modalVariants = { 
        hidden: { y: "-50px", opacity: 0 }, 
        visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 30 } }, 
        exit: { opacity: 0, scale: 0.9, transition: { duration: 0.15 } } // Animasi keluar disederhanakan
    };

    return (
        <motion.div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" variants={backdropVariants} initial="hidden" animate="visible" exit="hidden" onClick={onClose}>
            <motion.div className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-3xl shadow-xl border border-gray-100 w-full max-w-lg relative" variants={modalVariants} initial="hidden" animate="visible" exit="exit" onClick={(e) => e.stopPropagation()}>
                {/* ... (isi form tidak berubah) ... */}
                <div className="flex justify-between items-center mb-6 border-b pb-4 border-gray-200"><h2 className="text-3xl font-extrabold text-gray-800">Tambahkan Alat Baru</h2><button onClick={onClose} className="p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-all duration-200 focus:outline-none"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button></div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div><label className="block text-sm font-semibold text-gray-700 mb-1">Nama Alat</label><input required type="text" value={namaAlat} onChange={(e) => setNamaAlat(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200" placeholder="Masukkan nama alat" /></div>
                    <div><label className="block text-sm font-semibold text-gray-700 mb-1">Jenis Alat</label><input required type="text" value={jenisAlat} onChange={(e) => setJenisAlat(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200" placeholder="Contoh: Smart Irrigation" /></div>
                    <div><label className="block text-sm font-semibold text-gray-700 mb-1">Lokasi Alat</label><input required type="text" value={lokasiAlat} onChange={(e) => setLokasiAlat(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200" placeholder="Contoh: Sukawening, Dramaga" /></div>
                    <div className="relative"><label className="block text-sm font-semibold text-gray-700 mb-1">Status Alat</label><select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 appearance-none pr-8"><option value="active">Aktif</option><option value="inactive">Tidak Aktif</option><option value="maintenance">Perawatan</option></select><div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pt-6 px-4 text-gray-700"><svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg></div></div>
                    <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-8"><motion.button type="button" onClick={onClose} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold shadow-md">Batal</motion.button><motion.button type="submit" className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold shadow-md">Simpan Alat</motion.button></div>
                </form>
            </motion.div>
        </motion.div>
    );
};

// --- Komponen Modal Edit Alat (MODIFIKASI: Validasi & Notifikasi) ---
const ModalEditAlat = ({ alat, onClose, onUpdate }) => {
    const [formData, setFormData] = useState(alat);
    useEffect(() => { setFormData(alat); }, [alat]);
    
    const handleChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };
    
    const handleUpdate = (e) => {
      e.preventDefault();
      if (!formData.nama.trim() || !formData.jenis.trim() || !formData.lokasi.trim()) {
        toast.error('Semua field wajib diisi!');
        return;
      }
      onUpdate(formData);
      toast.success('Informasi alat berhasil diperbarui!');
      onClose();
    };

    const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
    const modalVariants = { 
        hidden: { y: "-50px", opacity: 0 }, 
        visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 30 } }, 
        exit: { opacity: 0, scale: 0.9, transition: { duration: 0.15 } } 
    };

    return (
        <motion.div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4" variants={backdropVariants} initial="hidden" animate="visible" exit="exit" onClick={onClose}>
            <motion.div className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-3xl shadow-xl border border-gray-100 w-full max-w-lg relative" variants={modalVariants} initial="hidden" animate="visible" exit="exit" onClick={(e) => e.stopPropagation()}>
                {/* ... (isi form tidak berubah) ... */}
                <div className="flex justify-between items-center mb-6 border-b pb-4 border-gray-200"><h2 className="text-3xl font-extrabold text-gray-800">Edit Alat</h2><button onClick={onClose} className="p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-all duration-200 focus:outline-none"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button></div>
                <form onSubmit={handleUpdate} className="space-y-6">
                    <div><label className="block text-sm font-semibold text-gray-700 mb-1">Nama Alat</label><input required type="text" name="nama" value={formData.nama} onChange={handleChange} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"/></div>
                    <div><label className="block text-sm font-semibold text-gray-700 mb-1">Jenis Alat</label><input required type="text" name="jenis" value={formData.jenis} onChange={handleChange} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"/></div>
                    <div><label className="block text-sm font-semibold text-gray-700 mb-1">Lokasi Alat</label><input required type="text" name="lokasi" value={formData.lokasi} onChange={handleChange} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"/></div>
                    <div className="relative"><label className="block text-sm font-semibold text-gray-700 mb-1">Status Alat</label><select name="status" value={formData.status} onChange={handleChange} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 appearance-none pr-8"><option value="active">Aktif</option><option value="inactive">Tidak Aktif</option><option value="maintenance">Perawatan</option></select><div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pt-6 px-4 text-gray-700"><svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg></div></div>
                    <div className="flex justify-end pt-6 border-t border-gray-200 mt-8 space-x-3"><motion.button type="button" onClick={onClose} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold shadow-md">Batal</motion.button><motion.button type="submit" className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold shadow-md">Simpan Perubahan</motion.button></div>
                </form>
            </motion.div>
        </motion.div>
    );
};

// --- Komponen Form untuk Tambah/Edit Jadwal (MODIFIKASI: Validasi & Notifikasi) ---
const ModalFormJadwal = ({ onSave, onClose, jadwalToEdit }) => {
    const [jadwal, setJadwal] = useState({ nama: '', tanggalMulai: '', tanggalSelesai: '', waktu: ['08:00'], durasi: 15, solenoid: [] });
    useEffect(() => { if (jadwalToEdit) { setJadwal({ ...jadwal, ...jadwalToEdit }); } }, [jadwalToEdit]);
    
    const handleWaktuChange = (index, value) => { const newWaktu = [...jadwal.waktu]; newWaktu[index] = value; setJadwal(prev => ({ ...prev, waktu: newWaktu })); };
    const tambahWaktu = () => setJadwal(prev => ({ ...prev, waktu: [...prev.waktu, '12:00'] }));
    const hapusWaktu = (index) => setJadwal(prev => ({ ...prev, waktu: jadwal.waktu.filter((_, i) => i !== index) }));
    const handleSolenoidToggle = (id) => { setJadwal(prev => ({ ...prev, solenoid: prev.solenoid.includes(id) ? prev.solenoid.filter(sId => sId !== id) : [...prev.solenoid, id] })); };
    const handlePilihSemuaSolenoid = () => { const semuaSolenoid = [1, 2, 3, 4, 5, 6]; if (jadwal.solenoid.length === semuaSolenoid.length) { setJadwal(prev => ({ ...prev, solenoid: [] })); } else { setJadwal(prev => ({ ...prev, solenoid: semuaSolenoid })); } };

    const handleSave = (e) => {
      e.preventDefault();
      // Validasi
      if (!jadwal.tanggalMulai || !jadwal.tanggalSelesai || jadwal.waktu.some(w => !w) || jadwal.durasi <= 0 || jadwal.solenoid.length === 0) {
        toast.error('Harap isi semua field yang wajib!');
        return;
      }
      onSave(jadwal);
      toast.success('Jadwal berhasil disimpan!');
      onClose();
    };
    
    // MODIFIKASI: Animasi 'exit' dihapus agar langsung hilang
    const modalVariants = {
        hidden: { opacity: 0, y: -30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.2 } }
    };

    return (
        <motion.div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={onClose}>
            <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="hidden"
                        className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                {/* ... (isi form tidak berubah) ... */}
                <h2 className="text-xl font-bold mb-4">{jadwalToEdit ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}</h2>
                <form onSubmit={handleSave} className="space-y-4">
                    <div><label className="block text-sm font-medium">Nama Jadwal (Opsional)</label><input type="text" value={jadwal.nama} onChange={e => setJadwal(prev => ({ ...prev, nama: e.target.value }))} placeholder="cth: Penyiraman Pagi" className="mt-1 w-full p-2 border rounded-md"/></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium">Tanggal Mulai <span className="text-red-500">*</span></label><input required type="date" value={jadwal.tanggalMulai} onChange={e => setJadwal(prev => ({ ...prev, tanggalMulai: e.target.value }))} className="mt-1 w-full p-2 border rounded-md"/></div>
                        <div><label className="block text-sm font-medium">Tanggal Selesai <span className="text-red-500">*</span></label><input required type="date" value={jadwal.tanggalSelesai} onChange={e => setJadwal(prev => ({ ...prev, tanggalSelesai: e.target.value }))} className="mt-1 w-full p-2 border rounded-md"/></div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Waktu Penyiraman <span className="text-red-500">*</span></label>
                        {jadwal.waktu.map((w, index) => (<div key={index} className="flex items-center gap-2 mt-2"><input required type="time" value={w} onChange={e => handleWaktuChange(index, e.target.value)} className="w-full p-2 border rounded-md"/>{jadwal.waktu.length > 1 && <button type="button" onClick={() => hapusWaktu(index)} className="p-2 bg-red-100 text-red-600 rounded-full">✕</button>}</div>))}
                        <button type="button" onClick={tambahWaktu} className="mt-2 text-sm text-blue-600 font-semibold">+ Tambah Waktu</button>
                    </div>
                    <div><label className="block text-sm font-medium">Durasi Menyala (Menit) <span className="text-red-500">*</span></label><input required type="number" value={jadwal.durasi} onChange={e => setJadwal(prev => ({ ...prev, durasi: parseInt(e.target.value) || 0 }))} min="1" className="mt-1 w-full p-2 border rounded-md"/></div>
                    <div>
                        <label className="block text-sm font-medium">Pilih Solenoid <span className="text-red-500">*</span></label>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {[1, 2, 3, 4, 5, 6].map(id => <button type="button" key={id} onClick={() => handleSolenoidToggle(id)} className={`px-3 py-1 rounded-full ${jadwal.solenoid.includes(id) ? 'bg-green-500 text-white' : 'bg-gray-200'}`}>Solenoid {id}</button>)}
                            <button type="button" onClick={handlePilihSemuaSolenoid} className="px-3 py-1 rounded-full bg-cyan-100 text-cyan-700 font-semibold">Pilih Semua</button>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t mt-6"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg">Batal</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Simpan</button></div>
                </form>
            </motion.div>
        </motion.div>
    );
};

// --- Komponen Modal Kontrol Irigasi (MODIFIKASI: Animasi keluar dihapus) ---
const ModalKontrolIrigasi = ({ alat, onClose, onEdit, onDelete }) => {
    // ... (kode state dan handler jadwal tidak berubah) ...
    const [daftarJadwal, setDaftarJadwal] = useState([ { id: 1, nama: 'Penyiraman Pagi', tanggalMulai: '2025-09-01', tanggalSelesai: '2025-09-07', waktu: ['07:00'], durasi: 10, solenoid: [1, 2, 5] }, { id: 2, nama: 'Semua Solenoid Siang', tanggalMulai: '2025-09-08', tanggalSelesai: '2025-09-15', waktu: ['12:00', '15:00'], durasi: 5, solenoid: [1, 2, 3, 4, 5, 6] }, ]);
    const [isFormJadwalVisible, setIsFormJadwalVisible] = useState(false);
    const [jadwalToEdit, setJadwalToEdit] = useState(null);
    const [solenoidTerpilihManual, setSolenoidTerpilihManual] = useState([]);
    const [modeManual, setModeManual] = useState(false);
    const handleTambahJadwal = () => { setJadwalToEdit(null); setIsFormJadwalVisible(true); };
    const handleEditJadwal = (jadwal) => { setJadwalToEdit(jadwal); setIsFormJadwalVisible(true); };
    const handleHapusJadwal = (id) => { if(window.confirm('Hapus jadwal ini?')) { setDaftarJadwal(prev => prev.filter(j => j.id !== id)); toast.success('Jadwal berhasil dihapus!'); } };
    const handleSimpanJadwal = (jadwalBaru) => { if (jadwalBaru.id) { setDaftarJadwal(prev => prev.map(j => j.id === jadwalBaru.id ? jadwalBaru : j)); } else { setDaftarJadwal(prev => [...prev, { ...jadwalBaru, id: Date.now() }]); } };
    const handlePilihSolenoidManual = (id) => setSolenoidTerpilihManual(prev => prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]);
    const handlePilihSemuaManual = () => { if (solenoidTerpilihManual.length === 6) setSolenoidTerpilihManual([]); else setSolenoidTerpilihManual([1, 2, 3, 4, 5, 6]); };

    // MODIFIKASI: Animasi keluar modal utama juga dihilangkan
    return (
      <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div layoutId={`card-container-${alat.id}`} transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      className="bg-gray-100 w-full h-full max-w-4xl rounded-2xl shadow-2xl flex flex-col overflow-hidden">
             {/* ... (isi modal tidak berubah) ... */}
             <div className="flex-shrink-0 flex justify-between items-center border-b border-gray-300 p-6 bg-white"><div><h2 className="text-2xl font-bold text-gray-800">Kontrol Irigasi: {alat.nama}</h2><p className="text-gray-500">{alat.lokasi}</p></div><div className="flex items-center space-x-2"><button onClick={() => onEdit(alat)} className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-semibold">Edit Info</button><button onClick={onClose} className="p-2 rounded-full bg-gray-200 hover:bg-gray-300"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button></div></div>
             <div className="flex-grow p-6 overflow-auto"><div className="bg-white p-6 rounded-xl shadow-md mb-6"><div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold text-gray-800">Daftar Jadwal Otomatis</h3><button onClick={handleTambahJadwal} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">+ Tambah Jadwal</button></div><div className="space-y-3">{daftarJadwal.length > 0 ? daftarJadwal.map(jadwal => (<div key={jadwal.id} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center"><div><p className="font-bold">{jadwal.nama || `Jadwal #${jadwal.id}`}</p><p className="text-sm text-gray-500">{jadwal.tanggalMulai} s/d {jadwal.tanggalSelesai} | Waktu: {jadwal.waktu.join(', ')} | Durasi: {jadwal.durasi} menit | Solenoid: {jadwal.solenoid.join(', ')}</p></div><div className="flex gap-2"><button onClick={() => handleEditJadwal(jadwal)} className="text-sm text-yellow-600">Edit</button><button onClick={() => handleHapusJadwal(jadwal.id)} className="text-sm text-red-600">Hapus</button></div></div>)) : <p className="text-center text-gray-500 py-4">Belum ada jadwal. Klik "Tambah Jadwal" untuk membuat.</p>}</div></div><div className="bg-white p-6 rounded-xl shadow-md"><h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Kontrol Manual</h3><div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">{[1, 2, 3, 4, 5, 6].map(id => (<button key={id} onClick={() => handlePilihSolenoidManual(id)} className={`p-4 rounded-lg text-center font-bold transition-all duration-200 ${solenoidTerpilihManual.includes(id) ? 'bg-green-500 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Solenoid {id}</button>))}<button onClick={handlePilihSemuaManual} className={`p-4 rounded-lg text-center font-bold transition-all duration-200 ${solenoidTerpilihManual.length === 6 ? 'bg-cyan-500 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>{solenoidTerpilihManual.length === 6 ? 'Batal Pilih' : 'Pilih Semua'}</button></div><div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg"><div className="font-semibold text-gray-800">Aktifkan Solenoid Manual<p className="text-xs text-gray-500 font-normal">Solenoid terpilih: {solenoidTerpilihManual.join(', ') || 'Tidak ada'}</p></div><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={modeManual} onChange={() => setModeManual(!modeManual)} className="sr-only peer" /><div className="w-14 h-7 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"></div></label></div></div></div>
          </motion.div>
        </motion.div>
        <AnimatePresence>
          {isFormJadwalVisible && <ModalFormJadwal onClose={() => setIsFormJadwalVisible(false)} onSave={handleSimpanJadwal} jadwalToEdit={jadwalToEdit} />}
        </AnimatePresence>
      </>
    );
};

// --- Komponen Halaman Utama ---
const AlatPage = () => {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [selectedAlat, setSelectedAlat] = useState(null);
  const [alatToEdit, setAlatToEdit] = useState(null);

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
  const [daftarAlat, setDaftarAlat] = useState([ { id: 1, nama: 'Pompa Hidroponik', jenis: 'Smart Irrigation', lokasi: 'Greenhouse A', status: 'active' }, ]);

  const handleTambahAlat = (alatBaru) => { const newAlatWithId = { ...alatBaru, id: Date.now() }; setDaftarAlat([...daftarAlat, newAlatWithId]); };
  const handleLihatDetail = (alat) => setSelectedAlat(alat);
  const handleEdit = (alat) => setAlatToEdit(alat);
  const handleUpdateAlat = (updatedAlat) => { setDaftarAlat(daftarAlat.map(alat => alat.id === updatedAlat.id ? updatedAlat : alat)); if(selectedAlat && selectedAlat.id === updatedAlat.id) { setSelectedAlat(updatedAlat); } };
  const handleHapusJadwal = (id) => { if(window.confirm('Hapus jadwal ini?')) setDaftarJadwal(prev => prev.filter(j => j.id !== id)); }; // Pindahkan ke sini jika perlu global

  return (
    <div className="relative flex bg-gray-100 min-h-screen">
      {/* BARU: Tambahkan Toaster untuk notifikasi */}
      <Toaster position="top-center" reverseOrder={false} />
      <Sidebar isOpen={isSidebarOpen} />
      <div className="flex-1 flex flex-col">
        <Header onMenuClick={toggleSidebar} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 md:p-8">
          <LayoutGroup>
            <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8" layout>
              {daftarAlat.map((alat) => (<AlatCard key={alat.id} alat={alat} onClick={() => handleLihatDetail(alat)} />))}
              <motion.div onClick={() => setIsFormVisible(true)} className="bg-slate-50 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-slate-300 text-slate-500 hover:border-blue-500 hover:text-blue-500 cursor-pointer transition-all duration-300 min-h-[180px]" whileHover={{ scale: 1.03 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
                <div className="p-4 bg-slate-200 rounded-full mb-3"><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg></div>
                <span className="font-semibold text-lg">Tambahkan Alat</span>
              </motion.div>
            </motion.div>
            <AnimatePresence>
              {selectedAlat && <ModalKontrolIrigasi alat={selectedAlat} onClose={() => setSelectedAlat(null)} onEdit={handleEdit} onDelete={(id) => {setDaftarAlat(prev => prev.filter(a => a.id !== id)); toast.success('Alat berhasil dihapus!');}} />}
            </AnimatePresence>
          </LayoutGroup>
        </main>
      </div>
      {isSidebarOpen && (<div onClick={toggleSidebar} className="fixed inset-0 bg-black opacity-50 z-20 md:hidden"></div>)}
      <AnimatePresence>
        {isFormVisible && <FormTambahAlat onClose={() => setIsFormVisible(false)} onTambahAlat={handleTambahAlat} />}
        {alatToEdit && <ModalEditAlat alat={alatToEdit} onClose={() => setAlatToEdit(null)} onUpdate={handleUpdateAlat} />}
      </AnimatePresence>
    </div>
  );
};

export default AlatPage;