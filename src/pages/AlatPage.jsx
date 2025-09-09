import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import api from '../api';
import MainLayout from '../components/MainLayout';

// ... (Komponen AlatCard, FormTambahAlat, ModalEditAlat, dll. tetap sama) ...
// --- Komponen Kartu Alat ---
const AlatCard = ({ alat, onClick }) => { 
  const { lokasi, jenis, status } = alat;
  const statusInfo = { active: { text: 'Active', textColor: 'text-green-600', bgColor: 'bg-green-100' }, inactive: { text: 'Inactive', textColor: 'text-red-600', bgColor: 'bg-red-100' }, maintenance: { text: 'Maintenance', textColor: 'text-orange-600', bgColor: 'bg-orange-100' } };
  const currentStatus = statusInfo[status] || { text: 'Unknown', textColor: 'text-gray-600', bgColor: 'bg-gray-100' };
  return (
    <motion.div layout layoutId={`card-container-${alat.id}`} className="bg-white rounded-2xl shadow-lg overflow-hidden transform hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col min-h-[180px]" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onClick} >
      <div className="p-6 flex-grow">
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
      <div className="bg-gray-50 px-6 py-3 mt-auto">
        {/* WARNA DIUBAH */}
        <span className="text-green-600 font-semibold text-sm hover:underline">
          Lihat Detail →
        </span>
      </div>
    </motion.div>
  );
};

// --- Komponen Form Tambah Alat ---
const FormTambahAlat = ({ onClose, onTambahAlat }) => {
    const [namaAlat, setNamaAlat] = useState('');
    const [jenisAlat, setJenisAlat] = useState('');
    const [lokasiAlat, setLokasiAlat] = useState('');
    const [status, setStatus] = useState('active');
    const handleSubmit = (e) => { e.preventDefault(); if (!namaAlat.trim() || !jenisAlat.trim() || !lokasiAlat.trim()) { toast.error('Semua field wajib diisi!'); return; } onTambahAlat({ nama: namaAlat, jenis: jenisAlat, lokasi: lokasiAlat, status: status }); toast.success('Alat baru berhasil ditambahkan!'); onClose(); };
    const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
    const modalVariants = { hidden: { y: "-50px", opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 30 } }, exit: { opacity: 0, scale: 0.9, transition: { duration: 0.15 } } };
    return (
        <motion.div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" variants={backdropVariants} initial="hidden" animate="visible" exit="hidden" onClick={onClose}>
            <motion.div className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-3xl shadow-xl border border-gray-100 w-full max-w-lg relative" variants={modalVariants} initial="hidden" animate="visible" exit="exit" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6 border-b pb-4 border-gray-200"><h2 className="text-3xl font-extrabold text-gray-800">Tambahkan Alat Baru</h2><button onClick={onClose} className="p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-all duration-200 focus:outline-none"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button></div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* WARNA DIUBAH */}
                    <div><label className="block text-sm font-semibold text-gray-700 mb-1">Nama Alat</label><input required type="text" value={namaAlat} onChange={(e) => setNamaAlat(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Masukkan nama alat" /></div>
                    <div><label className="block text-sm font-semibold text-gray-700 mb-1">Jenis Alat</label><input required type="text" value={jenisAlat} onChange={(e) => setJenisAlat(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Contoh: Smart Irrigation" /></div>
                    <div><label className="block text-sm font-semibold text-gray-700 mb-1">Lokasi Alat</label><input required type="text" value={lokasiAlat} onChange={(e) => setLokasiAlat(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Contoh: Sukawening, Dramaga" /></div>
                    <div className="relative"><label className="block text-sm font-semibold text-gray-700 mb-1">Status Alat</label><select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none pr-8"><option value="active">Aktif</option><option value="inactive">Tidak Aktif</option><option value="maintenance">Perawatan</option></select><div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pt-6 px-4 text-gray-700"><svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg></div></div>
                    <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-8"><motion.button type="button" onClick={onClose} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold shadow-md">Batal</motion.button><motion.button type="submit" className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold shadow-md">Simpan Alat</motion.button></div>
                </form>
            </motion.div>
        </motion.div>
    );
};

const ModalEditAlat = ({ alat, onClose, onUpdate, onDelete }) => {
    const [formData, setFormData] = useState(alat);
    
    useEffect(() => { setFormData(alat); }, [alat]);
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleUpdate = (e) => {
        e.preventDefault();
        if (!formData.nama.trim() || !formData.jenis.trim() || !formData.lokasi.trim()) {
            toast.error('Nama, Jenis, dan Lokasi wajib diisi!');
            return;
        }
        onUpdate(formData);
        onClose(); 
    };

    const handleDelete = () => {
        onDelete(alat.id);
        onClose();
    };

    const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
    const modalVariants = { hidden: { y: "-50px", opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 30 } }, exit: { opacity: 0, scale: 0.9, transition: { duration: 0.15 } } };
    
    return (
        <motion.div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4" variants={backdropVariants} initial="hidden" animate="visible" exit="exit" onClick={onClose}>
            <motion.div className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-3xl shadow-xl border border-gray-100 w-full max-w-lg relative" variants={modalVariants} initial="hidden" animate="visible" exit="exit" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6 border-b pb-4 border-gray-200"><h2 className="text-3xl font-extrabold text-gray-800">Edit Alat</h2><button onClick={onClose} className="p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-all duration-200 focus:outline-none"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button></div>
                <form onSubmit={handleUpdate} className="space-y-6">
                    <div><label className="block text-sm font-semibold text-gray-700 mb-1">Nama Alat</label><input required type="text" name="nama" value={formData.nama} onChange={handleChange} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"/></div>
                    <div><label className="block text-sm font-semibold text-gray-700 mb-1">Jenis Alat</label><input required type="text" name="jenis" value={formData.jenis} onChange={handleChange} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"/></div>
                    <div><label className="block text-sm font-semibold text-gray-700 mb-1">Lokasi Alat</label><input required type="text" name="lokasi" value={formData.lokasi} onChange={handleChange} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"/></div>
                    <div className="relative"><label className="block text-sm font-semibold text-gray-700 mb-1">Status Alat</label><select name="status" value={formData.status} onChange={handleChange} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none pr-8"><option value="active">Aktif</option><option value="inactive">Tidak Aktif</option><option value="maintenance">Perawatan</option></select><div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pt-6 px-4 text-gray-700"><svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg></div></div>
                    
                    {/* --- TAMBAHAN UNTUK MAC ADDRESS --- */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            MAC Address Perangkat
                        </label>
                        {alat.macAddress ? (
                            <p className="w-full p-3 border border-gray-200 rounded-xl bg-gray-200 text-gray-500 font-mono">
                                {alat.macAddress}
                            </p>
                        ) : (
                            <input
                                type="text"
                                name="macAddress" // Nama harus cocok dengan field di state dan database
                                value={formData.macAddress || ''}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
                                placeholder="Contoh: AA:BB:CC:11:22:33"
                            />
                        )}
                    </div>
                    {/* ------------------------------------ */}

                    <div className="flex justify-between items-center pt-6 border-t border-gray-200 mt-8">
                        <motion.button type="button" onClick={handleDelete} className="px-6 py-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 font-semibold shadow-sm">Hapus Alat</motion.button>
                        <div className="space-x-3"><motion.button type="button" onClick={onClose} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold shadow-md">Batal</motion.button><motion.button type="submit" className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold shadow-md">Simpan Perubahan</motion.button></div>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

// --- Komponen Form untuk Tambah/Edit Jadwal ---
const ModalFormJadwal = ({ onSave, onClose, jadwalToEdit }) => {
    const [jadwal, setJadwal] = useState({ nama: '', tanggalMulai: '', tanggalSelesai: '', waktu: ['08:00'], durasi: 15, solenoid: [] });
    useEffect(() => { if (jadwalToEdit) { setJadwal({ ...jadwal, ...jadwalToEdit }); } }, [jadwalToEdit]);
    const handleWaktuChange = (index, value) => { const newWaktu = [...jadwal.waktu]; newWaktu[index] = value; setJadwal(prev => ({ ...prev, waktu: newWaktu })); };
    const tambahWaktu = () => setJadwal(prev => ({ ...prev, waktu: [...prev.waktu, '12:00'] }));
    const hapusWaktu = (index) => setJadwal(prev => ({ ...prev, waktu: jadwal.waktu.filter((_, i) => i !== index) }));
    const handleSolenoidToggle = (id) => { setJadwal(prev => ({ ...prev, solenoid: prev.solenoid.includes(id) ? prev.solenoid.filter(sId => sId !== id) : [...prev.solenoid, id] })); };
    const handlePilihSemuaSolenoid = () => { const semuaSolenoid = [1, 2, 3, 4, 5, 6]; if (jadwal.solenoid.length === semuaSolenoid.length) { setJadwal(prev => ({ ...prev, solenoid: [] })); } else { setJadwal(prev => ({ ...prev, solenoid: semuaSolenoid })); } };
    const handleSave = (e) => { e.preventDefault(); if (!jadwal.tanggalMulai || !jadwal.tanggalSelesai || jadwal.waktu.some(w => !w) || jadwal.durasi <= 0 || jadwal.solenoid.length === 0) { toast.error('Harap isi semua field yang wajib!'); return; } onSave(jadwal); toast.success('Jadwal berhasil disimpan!'); onClose(); };
    const modalVariants = { hidden: { opacity: 0, y: -30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.2 } } };
    return (
        <motion.div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={onClose}>
            <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="hidden" className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">{jadwalToEdit ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}</h2>
                <form onSubmit={handleSave} className="space-y-4">
                    {/* WARNA DIUBAH */}
                    <div><label className="block text-sm font-medium">Nama Jadwal (Opsional)</label><input type="text" value={jadwal.nama} onChange={e => setJadwal(prev => ({ ...prev, nama: e.target.value }))} placeholder="cth: Penyiraman Pagi" className="mt-1 w-full p-2 border rounded-md"/></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium">Tanggal Mulai <span className="text-red-500">*</span></label><input required type="date" value={jadwal.tanggalMulai} onChange={e => setJadwal(prev => ({ ...prev, tanggalMulai: e.target.value }))} className="mt-1 w-full p-2 border rounded-md"/></div>
                        <div><label className="block text-sm font-medium">Tanggal Selesai <span className="text-red-500">*</span></label><input required type="date" value={jadwal.tanggalSelesai} onChange={e => setJadwal(prev => ({ ...prev, tanggalSelesai: e.target.value }))} className="mt-1 w-full p-2 border rounded-md"/></div>
                    </div>
                    <div><label className="block text-sm font-medium">Waktu Penyiraman <span className="text-red-500">*</span></label>{jadwal.waktu.map((w, index) => (<div key={index} className="flex items-center gap-2 mt-2"><input required type="time" value={w} onChange={e => handleWaktuChange(index, e.target.value)} className="w-full p-2 border rounded-md"/>{jadwal.waktu.length > 1 && <button type="button" onClick={() => hapusWaktu(index)} className="p-2 bg-red-100 text-red-600 rounded-full">✕</button>}</div>))}<button type="button" onClick={tambahWaktu} className="mt-2 text-sm text-green-600 font-semibold">+ Tambah Waktu</button></div>
                    <div><label className="block text-sm font-medium">Durasi Menyala (Menit) <span className="text-red-500">*</span></label><input required type="number" value={jadwal.durasi} onChange={e => setJadwal(prev => ({ ...prev, durasi: parseInt(e.target.value) || 0 }))} min="1" className="mt-1 w-full p-2 border rounded-md"/></div>
                    <div><label className="block text-sm font-medium">Pilih Solenoid <span className="text-red-500">*</span></label><div className="flex flex-wrap gap-2 mt-2">{[1, 2, 3, 4, 5, 6].map(id => <button type="button" key={id} onClick={() => handleSolenoidToggle(id)} className={`px-3 py-1 rounded-full ${jadwal.solenoid.includes(id) ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>Solenoid {id}</button>)}<button type="button" onClick={handlePilihSemuaSolenoid} className="px-3 py-1 rounded-full bg-green-100 text-green-800 font-semibold">Pilih Semua</button></div></div>
                    <div className="flex justify-end gap-3 pt-4 border-t mt-6"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg">Batal</button><button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Simpan</button></div>
                </form>
            </motion.div>
        </motion.div>
    );
};

// --- Komponen Modal Kontrol Irigasi ---
const ModalKontrolIrigasi = ({ alat, onClose, onEdit }) => {
    const [daftarJadwal, setDaftarJadwal] = useState([]);
    const [isLoadingJadwal, setIsLoadingJadwal] = useState(true);
    const [isFormJadwalVisible, setIsFormJadwalVisible] = useState(false);
    const [jadwalToEdit, setJadwalToEdit] = useState(null);
    const [solenoidTerpilihManual, setSolenoidTerpilihManual] = useState([]);
    // const [modeManual, setModeManual] = useState(false);

    useEffect(() => {
        const fetchJadwal = async () => {
            if (!alat.id) return;
            setIsLoadingJadwal(true);
            try {
                const response = await api.get(`/alat/${alat.id}/jadwal`);
                setDaftarJadwal(response.data);
            } catch {
                toast.error("Gagal memuat jadwal.");
            } finally {
                setIsLoadingJadwal(false);
            }
        };
        fetchJadwal();
    }, [alat.id]);

    const handleTambahJadwal = () => {
        setJadwalToEdit(null);
        setIsFormJadwalVisible(true);
    };

    // --- FUNGSI EDIT JADWAL DIPERBARUI ---
    const handleEditJadwal = (jadwal) => {
        setJadwalToEdit(jadwal); // Kirim data jadwal yang akan diedit ke form
        setIsFormJadwalVisible(true);
    };

    // --- FUNGSI SIMPAN JADWAL DIPERBARUI ---
    // Sekarang bisa menangani CREATE dan UPDATE
    const handleSimpanJadwal = async (jadwalBaru) => {
        // Cek apakah ini mode EDIT (jika objek jadwalBaru memiliki 'id')
        if (jadwalBaru.id) {
            // Logika untuk UPDATE
            try {
                const response = await api.patch(`/jadwal/${jadwalBaru.id}`, jadwalBaru);
                // Perbarui jadwal di state dengan data baru dari server
                setDaftarJadwal(prev => 
                    prev.map(j => j.id === jadwalBaru.id ? response.data : j)
                );
                toast.success("Jadwal berhasil diperbarui!");
            } catch (error) {
                toast.error("Gagal memperbarui jadwal.");
                console.error("Error updating schedule:", error);
            }
        } else {
            // Logika untuk CREATE (sudah ada sebelumnya)
            try {
                const response = await api.post(`/alat/${alat.id}/jadwal`, jadwalBaru);
                setDaftarJadwal(prev => [...prev, response.data]);
                // Toast success sudah ada di dalam form
            } catch (error) {
                toast.error("Gagal menyimpan jadwal baru.");
                console.error("Error saving schedule:", error);
            }
        }
    };
    
    const handleHapusJadwal = async (scheduleId) => {
        if (window.confirm('Menghapus jadwal ini akan menghapusnya dari SEMUA alat yang menggunakannya. Lanjutkan?')) {
            try {
                await api.delete(`/jadwal/${scheduleId}`);
                setDaftarJadwal(prev => prev.filter(j => j.id !== scheduleId));
                toast.success('Jadwal berhasil dihapus!');
            } catch (error) {
                toast.error("Gagal menghapus jadwal.");
                console.error("Error deleting schedule:", error);
            }
        }
    };

    const handlePilihSolenoidManual = (id) => setSolenoidTerpilihManual(prev => prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]);
    const handlePilihSemuaManual = () => { if (solenoidTerpilihManual.length === 6) setSolenoidTerpilihManual([]); else setSolenoidTerpilihManual([1, 2, 3, 4, 5, 6]); };

    return (
        <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit="hidden" className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div layoutId={`card-container-${alat.id}`} transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="bg-gray-100 w-full h-full max-w-4xl rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                    <div className="flex-shrink-0 flex justify-between items-center border-b border-gray-300 p-6 bg-white">
                        <div><h2 className="text-2xl font-bold text-gray-800">Kontrol Irigasi: {alat.nama}</h2><p className="text-gray-500">{alat.lokasi}</p></div>
                        <div className="flex items-center space-x-2"><button onClick={() => onEdit(alat)} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-semibold">Edit Info</button><button onClick={onClose} className="p-2 rounded-full bg-gray-200 hover:bg-gray-300"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button></div>
                    </div>
                    <div className="flex-grow p-6 overflow-auto">
                        <div className="bg-white p-6 rounded-xl shadow-md mb-6">
                            <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold text-gray-800">Daftar Jadwal Otomatis</h3><button onClick={handleTambahJadwal} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">+ Tambah Jadwal</button></div>
                            <div className="space-y-3">
                                {isLoadingJadwal ? <p>Memuat jadwal...</p> : daftarJadwal.length > 0 ? daftarJadwal.map(jadwal => (
                                    <div key={jadwal.id} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                                        <div>
                                            <p className="font-bold">{jadwal.nama || `Jadwal #${jadwal.id}`}</p>
                                            <p className="text-sm text-gray-500">
                                                {jadwal.tanggalMulai} s/d {jadwal.tanggalSelesai} | 
                                                Waktu: {Array.isArray(jadwal.waktu) ? jadwal.waktu.join(', ') : ''} | 
                                                Durasi: {jadwal.durasi} menit | 
                                                Solenoid: {Array.isArray(jadwal.solenoid) ? jadwal.solenoid.join(', ') : ''}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEditJadwal(jadwal)} className="text-sm text-yellow-600 hover:text-yellow-800">Edit</button>
                                            <button onClick={() => handleHapusJadwal(jadwal.id)} className="text-sm text-red-600 hover:text-red-800">Hapus</button>
                                        </div>
                                    </div>
                                )) : <p className="text-center text-gray-500 py-4">Belum ada jadwal. Klik "Tambah Jadwal" untuk membuat.</p>}
                            </div>
                        </div>
                        {/* ... (bagian Kontrol Manual tetap sama) ... */}
                    </div>
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
  const [selectedAlat, setSelectedAlat] = useState(null);
  const [alatToEdit, setAlatToEdit] = useState(null);
  
  // DIUBAH: State daftarAlat awalnya kosong
  const [daftarAlat, setDaftarAlat] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // BARU: state untuk loading

  // Ganti fungsi useEffect Anda dengan ini
useEffect(() => {
    const fetchAlat = async () => {
        try {
            const response = await api.get('/alat');
            setDaftarAlat(response.data);
        } catch (error) {
            toast.error("Gagal memuat data alat.");
            console.error("Error fetching data: ", error);
        } finally {
            setIsLoading(false);
        }
    };

    fetchAlat();
}, []);

  // Ganti fungsi handleTambahAlat Anda dengan ini
  const handleTambahAlat = async (alatBaru) => {
      try {
          const response = await api.post('/alat', alatBaru);
          setDaftarAlat([...daftarAlat, response.data.device]); // Diperbarui untuk cocok dengan respons backend
      } catch (error) {
          toast.error("Gagal menambahkan alat baru.");
          console.error("Error adding tool: ", error);
          // Tambahkan ini untuk melihat detail error dari backend
          if (error.response) {
              console.error("Data Error:", error.response.data);
          }
      }
  };

  const handleLihatDetail = (alat) => setSelectedAlat(alat);
  const handleEdit = (alat) => {
        // Tutup modal detail jika terbuka, lalu buka modal edit
        setSelectedAlat(null);
        setAlatToEdit(alat);
  };

  // DIUBAH: handleUpdateAlat (perlu API endpoint PUT /api/alat/:id)
  const handleUpdateAlat = async (updatedAlat) => {
        try {
            // Panggil endpoint PATCH di backend
            await api.patch(`/alat/${updatedAlat.id}`, updatedAlat);

            // Perbarui state di frontend agar UI langsung berubah
            setDaftarAlat(daftarAlat.map(alat =>
                alat.id === updatedAlat.id ? updatedAlat : alat
            ));
            
            setAlatToEdit(null); // Tutup modal edit
            toast.success("Alat berhasil diperbarui!");

        } catch (error) {
            toast.error("Gagal memperbarui alat.");
            console.error("Error updating tool:", error);
        }
  };
  
  const handleHapusAlat = async (idAlat) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus alat ini?')) {
            try {
                // Panggil endpoint DELETE di backend
                await api.delete(`/alat/${idAlat}`);

                // Hapus alat dari state di frontend
                setDaftarAlat(prev => prev.filter(a => a.id !== idAlat));
                
                toast.success('Alat berhasil dihapus!');
                // Tutup semua modal yang mungkin terbuka untuk alat yang dihapus
                setSelectedAlat(null);
                setAlatToEdit(null);
            } catch (error) {
                toast.error("Gagal menghapus alat.");
                console.error("Error deleting tool:", error);
            }
        }
  };

  return (
    <MainLayout className="relative flex bg-gray-100 min-h-screen">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-x-hidden overflow-y-auto p-6 md:p-8">
          <LayoutGroup>
            <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8" layout>
              {isLoading ? (
                <p>Loading data...</p> // Tampilkan pesan loading
              ) : (
                <>
                  {daftarAlat.map((alat) => (<AlatCard key={alat.id} alat={alat} onClick={() => handleLihatDetail(alat)} />))}
                  <motion.div onClick={() => setIsFormVisible(true)} className="bg-slate-50 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-slate-300 text-slate-500 hover:border-blue-500 hover:text-blue-500 cursor-pointer transition-all duration-300 min-h-[180px]" whileHover={{ scale: 1.03 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
                    <div className="p-4 bg-slate-200 rounded-full mb-3"><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg></div>
                    <span className="font-semibold text-lg">Tambahkan Alat</span>
                  </motion.div>
                </>
              )}
            </motion.div>
            <AnimatePresence>
              {selectedAlat && <ModalKontrolIrigasi alat={selectedAlat} onClose={() => setSelectedAlat(null)} onEdit={handleEdit} onDelete={handleHapusAlat} />}
            </AnimatePresence>
          </LayoutGroup> 
      </div>
      <AnimatePresence>
        {isFormVisible && <FormTambahAlat onClose={() => setIsFormVisible(false)} onTambahAlat={handleTambahAlat} />}
        {alatToEdit && <ModalEditAlat alat={alatToEdit} onClose={() => setAlatToEdit(null)} onUpdate={handleUpdateAlat} onDelete={handleHapusAlat} />}
      </AnimatePresence>
    </div>
    </MainLayout>
  );
};

export default AlatPage;