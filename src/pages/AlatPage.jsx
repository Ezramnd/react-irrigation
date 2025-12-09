import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { 
  FaCrosshairs, 
  FaThermometerHalf, 
  FaTint, 
  FaBolt, 
  FaClock, 
  FaPowerOff, 
  FaCog, 
  FaSave, 
  FaInfoCircle, 
  FaExclamationTriangle, 
  FaChartLine,
  FaCheckCircle, 
  FaExclamationCircle,
  FaHandPaper,
  FaQrcode, // <--- Tambahkan ini (Solusi Error FaQrcode is not defined)
  FaImage   // <--- Tambahkan ini juga (Karena kamu menggunakannya di tombol "Upload Gambar")
} from 'react-icons/fa';
import QrScannerLib from 'qr-scanner';
import api from '../api';
import MainLayout from '../components/MainLayout';
import QrScanner from '../components/QrScanner';

const socket = io('http://localhost:5000');

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
                <span className="text-green-600 font-semibold text-sm hover:underline">
                    Lihat Detail →
                </span>
            </div>
        </motion.div>
    );
};

// --- Komponen Form Tambah Alat ---
const FormTambahAlat = ({ onClose, onTambahAlat }) => {
    const jenisOptions = ['Smart Irrigation', 'Climate', 'Dosing'];
    const [namaAlat, setNamaAlat] = useState('');
    const [jenisAlat, setJenisAlat] = useState(jenisOptions[0]); 
    const [lokasiAlat, setLokasiAlat] = useState('');
    const [status, setStatus] = useState('active');
    const [macAddress, setMacAddress] = useState('');
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const fileInputRef = useRef(null);
    
    const handleFileScan = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const notif = toast.loading("Menganalisis gambar QR Code...");
        try {
            const result = await QrScannerLib.scanImage(file, { returnDetailedScanResult: true });
            setMacAddress(result.data);
            toast.success("MAC Address berhasil dipindai!", { id: notif });
        } catch (error) {
            console.error(error);
            toast.error("QR Code tidak ditemukan di gambar.", { id: notif });
        }
        // Reset input file agar bisa memilih file yang sama lagi
        event.target.value = null; 
    };

    const handleSubmit = (e) => { 
        e.preventDefault(); 
        if (!namaAlat.trim() || !jenisAlat.trim() || !lokasiAlat.trim()) { 
            toast.error('Semua field wajib diisi!'); 
            return; 
        } 
        onTambahAlat({ 
            nama: namaAlat, 
            jenis: jenisAlat, 
            lokasi: lokasiAlat, 
            status: status,
            macAddress: macAddress
        }); 
        toast.success('Alat baru berhasil ditambahkan!'); 
        onClose(); 
    };
    
    const handleScanSuccess = (scannedData) => {
        setMacAddress(scannedData);
        setIsScannerOpen(false);
        toast.success('MAC Address berhasil dipindai!', {
        id: 'scan-success-toast', // Beri ID unik
        });
    };
    
    const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
    const modalVariants = { hidden: { y: "-50px", opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 30 } }, exit: { opacity: 0, scale: 0.9, transition: { duration: 0.15 } } };
    
    return (
        <>
            <motion.div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" variants={backdropVariants} initial="hidden" animate="visible" exit="hidden" onClick={onClose}>
                <div className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-3xl shadow-xl border border-gray-100 w-full max-w-lg relative" variants={modalVariants} initial="hidden" animate="visible" exit="exit" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-6 border-b pb-4 border-gray-200"><h2 className="text-3xl font-extrabold text-gray-800">Tambahkan Alat Baru</h2><button onClick={onClose} className="p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-all duration-200 focus:outline-none"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button></div>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div><label className="block text-sm font-semibold text-gray-700 mb-1">Nama Alat</label><input required type="text" value={namaAlat} onChange={(e) => setNamaAlat(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Masukkan nama alat" /></div>
                        <div className="relative"><label className="block text-sm font-semibold text-gray-700 mb-1">Jenis Alat</label><select value={jenisAlat} onChange={(e) => setJenisAlat(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none pr-8">{jenisOptions.map(option => (<option key={option} value={option}>{option}</option> ))}</select><div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pt-6 px-4 text-gray-700"><svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg></div></div>
                        <div><label className="block text-sm font-semibold text-gray-700 mb-1">Lokasi Alat</label><input required type="text" value={lokasiAlat} onChange={(e) => setLokasiAlat(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-italic" placeholder="Sukawening, Dramaga" /></div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                MAC Address Perangkat
                            </label>
                            <div className="flex flex-col space-y-2">
                                {/* Input untuk menampilkan hasil (bisa diketik manual juga) */}
                                <input
                                    type="text"
                                    value={macAddress}
                                    onChange={(e) => setMacAddress(e.target.value)}
                                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
                                    placeholder="Isi manual atau pindai..."
                                    required
                                />
                                
                                {/* Tombol-tombol pemindai */}
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsScannerOpen(true)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors duration-300 shadow-sm"
                                    >
                                        <FaQrcode className="h-5 w-5" />
                                        <span>Pindai Kamera</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current.click()}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 transition-colors duration-300 shadow-sm"
                                    >
                                        <FaImage className="h-5 w-5" />
                                        <span>Upload Gambar</span>
                                    </button>
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    ref={fileInputRef}
                                    onChange={handleFileScan}
                                    className="hidden"
                                />
                            </div>
                        </div>
                        
                        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-8"><motion.button type="button" onClick={onClose} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold shadow-md">Batal</motion.button><motion.button type="submit" className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold shadow-md">Simpan Alat</motion.button></div>
                    </form>
                </div>
            </motion.div>
            
            <AnimatePresence>
                {isScannerOpen && (
                    <QrScanner
                        onScan={handleScanSuccess}
                        onClose={() => setIsScannerOpen(false)}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

// Jadwal Climate
const ModalFormJadwalClimate = ({ onSave, onClose, jadwalToEdit }) => {
    
    // 1. STATE: 'solenoid' diubah menjadi 'fans'
    const [jadwal, setJadwal] = useState({ 
        nama: '', 
        tanggalMulai: '', 
        tanggalSelesai: '', 
        waktu: ['08:00'], 
        durasi: 15, 
        fans: [] // <- Perubahan di sini
    });

    useEffect(() => { 
        if (jadwalToEdit) { 
            // Saat mengedit, pastikan data 'fans' ada, atau berikan default array kosong
            setJadwal({ 
                ...jadwal, 
                ...jadwalToEdit, 
                fans: jadwalToEdit.fans || [] 
            }); 
        } 
    }, [jadwalToEdit]);

    // --- Handler Waktu (Sama seperti aslinya) ---
    const handleWaktuChange = (index, value) => { 
        const newWaktu = [...jadwal.waktu]; 
        newWaktu[index] = value; 
        setJadwal(prev => ({ ...prev, waktu: newWaktu })); 
    };
    const tambahWaktu = () => setJadwal(prev => ({ ...prev, waktu: [...prev.waktu, '12:00'] }));
    const hapusWaktu = (index) => setJadwal(prev => ({ ...prev, waktu: jadwal.waktu.filter((_, i) => i !== index) }));

    // --- 2. LOGIC: Diubah untuk 'fans' ---
    const handleFanToggle = (id) => { 
        setJadwal(prev => ({ 
            ...prev, 
            fans: prev.fans.includes(id) 
                ? prev.fans.filter(fId => fId !== id) // Hapus kipas
                : [...prev.fans, id] // Tambah kipas
        })); 
    };

    const handlePilihSemuaFans = () => { 
        const semuaFans = [1, 2]; // Hanya ada Kipas 1 dan 2
        if (jadwal.fans.length === semuaFans.length) { 
            setJadwal(prev => ({ ...prev, fans: [] })); // Kosongkan
        } else { 
            setJadwal(prev => ({ ...prev, fans: semuaFans })); // Isi semua
        } 
    };

    // --- 3. VALIDATION: Diubah untuk 'fans' ---
    const handleSave = (e) => { 
        e.preventDefault(); 
        
        // Validasi
        if (!jadwal.tanggalMulai || !jadwal.tanggalSelesai || jadwal.waktu.some(w => !w) || jadwal.durasi <= 0 || jadwal.fans.length === 0) { 
            toast.error('Harap isi semua field yang wajib (termasuk minimal 1 kipas)!'); 
            return; 
        } 
        
        // Kirim data jadwal ke parent (ModalKontrolClimate)
        onSave(jadwal); 
        onClose(); 
    };
    
    // --- 4. ANIMATION: Memperbaiki div -> motion.div ---
    const modalVariants = { 
        hidden: { opacity: 0, y: -30 }, 
        visible: { opacity: 1, y: 0, transition: { duration: 0.2 } } 
    };

    return (
        // Latar belakang modal
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={onClose}>
            
            {/* 4. Menggunakan motion.div agar animasi 'variants' berfungsi */}
            <motion.div 
                variants={modalVariants} 
                initial="hidden" 
                animate="visible" 
                exit="hidden" 
                className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-2xl" 
                onClick={e => e.stopPropagation()}
            >
                <h2 className="text-xl font-bold mb-4">{jadwalToEdit ? 'Edit Jadwal Climate' : 'Tambah Jadwal Climate'}</h2>
                <form onSubmit={handleSave} className="space-y-4">
                    
                    {/* Nama Jadwal (Opsional) */}
                    <div><label className="block text-sm font-medium">Nama Jadwal (Opsional)</label><input type="text" value={jadwal.nama} onChange={e => setJadwal(prev => ({ ...prev, nama: e.target.value }))} placeholder="cth: Pendinginan Siang Hari" className="mt-1 w-full p-2 border rounded-md"/></div>
                    
                    {/* Tanggal Mulai & Selesai */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium">Tanggal Mulai <span className="text-red-500">*</span></label><input required type="date" value={jadwal.tanggalMulai} onChange={e => setJadwal(prev => ({ ...prev, tanggalMulai: e.target.value }))} className="mt-1 w-full p-2 border rounded-md"/></div>
                        <div><label className="block text-sm font-medium">Tanggal Selesai <span className="text-red-500">*</span></label><input required type="date" value={jadwal.tanggalSelesai} onChange={e => setJadwal(prev => ({ ...prev, tanggalSelesai: e.target.value }))} className="mt-1 w-full p-2 border rounded-md"/></div>
                    </div>
                    
                    {/* Waktu Aktivasi */}
                    <div><label className="block text-sm font-medium">Waktu Aktivasi Kipas <span className="text-red-500">*</span></label>{jadwal.waktu.map((w, index) => (<div key={index} className="flex items-center gap-2 mt-2"><input required type="time" value={w} onChange={e => handleWaktuChange(index, e.target.value)} className="w-full p-2 border rounded-md"/>{jadwal.waktu.length > 1 && <button type="button" onClick={() => hapusWaktu(index)} className="p-2 bg-red-100 text-red-600 rounded-full">✕</button>}</div>))}<button type="button" onClick={tambahWaktu} className="mt-2 text-sm text-green-600 font-semibold">+ Tambah Waktu</button></div>
                    
                    {/* Durasi */}
                    <div><label className="block text-sm font-medium">Durasi Menyala (Menit) <span className="text-red-500">*</span></label><input required type="number" value={jadwal.durasi} onChange={e => setJadwal(prev => ({ ...prev, durasi: parseInt(e.target.value) || 0 }))} min="1" className="mt-1 w-full p-2 border rounded-md"/></div>
                    
                    {/* --- 5. JSX: Diubah untuk 'fans' --- */}
                    <div>
                        <label className="block text-sm font-medium">Pilih Kipas <span className="text-red-500">*</span></label>
                        <div className="flex flex-wrap gap-2 mt-2">
                            
                            {/* Hanya Kipas 1 dan 2 */}
                            {[1, 2].map(id => (
                                <button 
                                    type="button" 
                                    key={id} 
                                    onClick={() => handleFanToggle(id)} 
                                    className={`px-3 py-1 rounded-full ${jadwal.fans.includes(id) ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
                                >
                                    Kipas {id}
                                </button>
                            ))}
                            
                            <button 
                                type="button" 
                                onClick={handlePilihSemuaFans} 
                                className="px-3 py-1 rounded-full bg-green-100 text-green-800 font-semibold"
                            >
                                Pilih Semua
                            </button>
                        </div>
                    </div>

                    {/* Tombol Simpan/Batal */}
                    <div className="flex justify-end gap-3 pt-4 border-t mt-6"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg">Batal</button><button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Simpan</button></div>
                </form>
            </motion.div>
        </div>
    );
};

// CLIMATE
const ModalKontrolClimate = ({ alat, onClose, onEdit }) => {
    
    const [settings, setSettings] = useState({
        minSuhuKipas1: 28, // Suhu Kipas 1 OFF
        maxSuhuKipas1: 30, // Suhu Kipas 1 ON
        minSuhuKipas2: 33, // Suhu Kipas 2 OFF
        maxSuhuKipas2: 35  // Suhu Kipas 2 ON
    });
    const [isLoadingSettings, setIsLoadingSettings] = useState(true);

    // State untuk Pengaturan Jadwal (Kolom Kanan)
    const [daftarJadwal, setDaftarJadwal] = useState([]);
    const [isLoadingJadwal, setIsLoadingJadwal] = useState(true);
    const [isFormJadwalVisible, setIsFormJadwalVisible] = useState(false);
    const [jadwalToEdit, setJadwalToEdit] = useState(null);

    useEffect(() => {
        const fetchSettings = async () => {
            setIsLoadingSettings(true);
            try {
                const response = await api.get(`/alat/${alat.id}/climate-settings`);
                if (response.data) {
                    setSettings(response.data);
                }
                // await new Promise(res => setTimeout(res, 300));
            } catch (error) { toast.error("Gagal memuat pengaturan treshold."); }
            finally { setIsLoadingSettings(false); }
        };

        // --- Memuat jadwal dari API ---
        const fetchJadwal = async () => {
            if (!alat.id) return;
            setIsLoadingJadwal(true);
            try {
                // Memanggil API backend yang baru kita buat
                const response = await api.get(`/alat/${alat.id}/climate-jadwal`);
                setDaftarJadwal(response.data);
                
            } catch { 
                toast.error("Gagal memuat jadwal climate."); 
            }
            finally { 
                setIsLoadingJadwal(false); 
            }
        };

        fetchSettings();
        fetchJadwal();
    }, [alat.id]);

    const handleSaveSettings = async () => {
        if (settings.minSuhuKipas1 >= settings.maxSuhuKipas1) {
            toast.error("Pengaturan Kipas 1 tidak valid: Suhu OFF harus lebih rendah dari suhu ON.");
            return;
        }
        if (settings.minSuhuKipas2 >= settings.maxSuhuKipas2) {
            toast.error("Pengaturan Kipas 2 tidak valid: Suhu OFF harus lebih rendah dari suhu ON.");
            return;
        }

        toast.promise(
            api.patch(`/alat/${alat.id}/climate-settings`, settings),
            // new Promise(res => setTimeout(res, 1000)), // Masih simulasi
            {
                loading: 'Menyimpan pengaturan treshold...',
                success: 'Pengaturan treshold berhasil disimpan!',
                error: 'Gagal menyimpan pengaturan treshold.',
            }
        );
    };

    // Handler untuk membuka modal form jadwal (Sudah benar)
    const handleTambahJadwal = () => {
        setJadwalToEdit(null);
        setIsFormJadwalVisible(true);
    };

    const handleEditJadwal = (jadwal) => {
        setJadwalToEdit(jadwal);
        setIsFormJadwalVisible(true);
    };

    // --- Handler untuk menyimpan/update jadwal ---
    const handleSimpanJadwal = async (jadwalBaru) => {
        if (jadwalBaru.id) {
            // Logika UPDATE (Patch)
            try {
                // Mengirim data ke API
                const response = await api.patch(`/climate-jadwal/${jadwalBaru.id}`, jadwalBaru);
                // Memperbarui state frontend
                setDaftarJadwal(prev => 
                    prev.map(j => j.id === jadwalBaru.id ? response.data : j)
                );
                toast.success("Jadwal climate berhasil diperbarui!");
            } catch (error) { toast.error("Gagal memperbarui jadwal climate."); }
        } else {
            // Logika CREATE (Post)
            try {
                // Mengirim data ke API
                const response = await api.post(`/alat/${alat.id}/climate-jadwal`, jadwalBaru);
                // Memperbarui state frontend
                setDaftarJadwal(prev => [...prev, response.data]);
                toast.success("Jadwal climate baru berhasil disimpan!");
            } catch (error) { toast.error("Gagal menyimpan jadwal climate baru."); }
        }
    };
    
    // --- Handler untuk menghapus jadwal ---
    const handleHapusJadwal = async (scheduleId) => {
        if (window.confirm('Anda yakin ingin menghapus jadwal ini?')) {
            try {
                // Menghapus data via API
                await api.delete(`/climate-jadwal/${scheduleId}`);
                // Menghapus data dari state frontend
                setDaftarJadwal(prev => prev.filter(j => j.id !== scheduleId));
                toast.success('Jadwal berhasil dihapus!');
            } catch (error) { toast.error("Gagal menghapus jadwal."); }
        }
    };


    return (
        <>
            <div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div layoutId={`card-container-${alat.id}`} className="bg-gray-100 w-full h-full max-w-4xl rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                    <div className="flex-shrink-0 flex justify-between items-center border-b p-6 bg-white">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">Kontrol Iklim: {alat.nama}</h2>
                            <p className="text-gray-500">{alat.lokasi}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button onClick={() => onEdit(alat)} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-semibold">Edit Info</button>
                            <button onClick={onClose} className="p-2 rounded-full bg-gray-200 hover:bg-gray-300"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                        </div>
                    </div>
                    
                    <div className="flex-grow p-6 overflow-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* --- Pengaturan Otomatis (Treshold) --- */}
                        <div className="bg-white p-6 rounded-xl shadow-md flex flex-col">
                            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-4">Pengaturan Otomatis (Treshold)</h3>
                            {isLoadingSettings ? <p>Memuat...</p> : (
                                <div className="space-y-6 flex-grow flex flex-col justify-between">
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Suhu Minimal (Kipas 1 OFF)</label>
                                            <div className="flex items-center gap-4">
                                                <FaThermometerHalf className="text-blue-500" />
                                                <input 
                                                    type="range" min="15" max="40" 
                                                    value={settings.minSuhuKipas1} 
                                                    onChange={(e) => setSettings(s => ({...s, minSuhuKipas1: Number(e.target.value)}))} 
                                                    className="w-full" 
                                                />
                                                <span className="font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-md">{settings.minSuhuKipas1}°C</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Suhu Maksimal (Kipas 1 ON)</label>
                                            <div className="flex items-center gap-4">
                                                <FaThermometerHalf className="text-red-500" />
                                                <input 
                                                    type="range" min="15" max="40" 
                                                    value={settings.maxSuhuKipas1} 
                                                    onChange={(e) => setSettings(s => ({...s, maxSuhuKipas1: Number(e.target.value)}))} 
                                                    className="w-full" 
                                                />
                                                <span className="font-bold text-red-600 bg-red-100 px-3 py-1 rounded-md">{settings.maxSuhuKipas1}°C</span>
                                            </div>
                                        </div>

                                        <hr className="border-gray-300 my-2" />

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Suhu Minimal (Kipas 2 OFF)</label>
                                            <div className="flex items-center gap-4">
                                                <FaThermometerHalf className="text-blue-500" />
                                                <input 
                                                    type="range" min="15" max="40" 
                                                    value={settings.minSuhuKipas2} 
                                                    onChange={(e) => setSettings(s => ({...s, minSuhuKipas2: Number(e.target.value)}))} 
                                                    className="w-full" 
                                                />
                                                <span className="font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-md">{settings.minSuhuKipas2}°C</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Suhu Maksimal (Kipas 2 ON)</label>
                                            <div className="flex items-center gap-4">
                                                <FaThermometerHalf className="text-red-500" />
                                                <input 
                                                    type="range" min="15" max="40" 
                                                    value={settings.maxSuhuKipas2} 
                                                    onChange={(e) => setSettings(s => ({...s, maxSuhuKipas2: Number(e.target.value)}))} 
                                                    className="w-full" 
                                                />
                                                <span className="font-bold text-red-600 bg-red-100 px-3 py-1 rounded-md">{settings.maxSuhuKipas2}°C</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={handleSaveSettings} className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">Simpan Pengaturan</button>
                                </div>
                            )}
                        </div>

                        

                        {/* --- Pengaturan Jadwal Otomatis --- */}
                        <div className="bg-white p-6 rounded-xl shadow-md flex flex-col">
                            <div className="flex justify-between items-center mb-4 border-b pb-4">
                                <h3 className="text-xl font-bold text-gray-800">Jadwal Otomatis</h3>
                                <button onClick={handleTambahJadwal} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">+ Tambah Jadwal</button>
                            </div>
                            
                            <div className="space-y-3 overflow-auto flex-grow">
                                {isLoadingJadwal ? <p>Memuat jadwal...</p> 
                                : daftarJadwal.length > 0 ? daftarJadwal.map(jadwal => (
                                    <div key={jadwal.id} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                                        <div>
                                            <p className="font-bold">{jadwal.nama || `Jadwal #${jadwal.id}`}</p>
                                            <p className="text-sm text-gray-500">
                                                {/* [DATA AKTIF] Data ini sekarang dari database */}
                                                Waktu: {Array.isArray(jadwal.waktu) ? jadwal.waktu.join(', ') : ''} | 
                                                Durasi: {jadwal.durasi} menit | 
                                                Kipas: {Array.isArray(jadwal.fans) ? jadwal.fans.join(', ') : ''}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEditJadwal(jadwal)} className="text-sm text-yellow-600 hover:text-yellow-800">Edit</button>
                                            <button onClick={() => handleHapusJadwal(jadwal.id)} className="text-sm text-red-600 hover:text-red-800">Hapus</button>
                                        </div>
                                    </div>
                                )) 
                                : <p className="text-center text-gray-500 py-4">Belum ada jadwal. Klik "Tambah Jadwal" untuk membuat.</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Form Jadwal (Tidak berubah) */}
            <AnimatePresence>
                {isFormJadwalVisible && (
                    <ModalFormJadwalClimate 
                        onClose={() => setIsFormJadwalVisible(false)} 
                        onSave={handleSimpanJadwal} 
                        jadwalToEdit={jadwalToEdit}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

// --- Komponen Modal Edit Alat ---
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4" variants={backdropVariants} initial="hidden" animate="visible" exit="exit" onClick={onClose}>
            <div className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-3xl shadow-xl border border-gray-100 w-full max-w-lg relative" variants={modalVariants} initial="hidden" animate="visible" exit="exit" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6 border-b pb-4 border-gray-200"><h2 className="text-3xl font-extrabold text-gray-800">Edit Alat</h2><button onClick={onClose} className="p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-all duration-200 focus:outline-none"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button></div>
                <form onSubmit={handleUpdate} className="space-y-6">
                    <div><label className="block text-sm font-semibold text-gray-700 mb-1">Nama Alat</label><input required type="text" name="nama" value={formData.nama} onChange={handleChange} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"/></div>
                    <div className="relative"><label className="block text-sm font-semibold text-gray-700 mb-1">Jenis Alat</label><select name="jenis" value={formData.jenis} onChange={handleChange} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none pr-8">{['Smart Irrigation', 'Climate', 'Dosing'].map(option => (<option key={option} value={option}>{option}</option>))}</select><div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pt-6 px-4 text-gray-700"><svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg></div></div>
                    <div><label className="block text-sm font-semibold text-gray-700 mb-1">Lokasi Alat</label><input required type="text" name="lokasi" value={formData.lokasi} onChange={handleChange} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"/></div>
                    <div className="relative"><label className="block text-sm font-semibold text-gray-700 mb-1">Status Alat</label><select name="status" value={formData.status} onChange={handleChange} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none pr-8"><option value="active">Aktif</option><option value="inactive">Tidak Aktif</option><option value="maintenance">Perawatan</option></select><div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pt-6 px-4 text-gray-700"><svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg></div></div>
                    
                    {/* MAC Address Field (Read-only like SSID) */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            MAC Address Perangkat
                        </label>
                        <p className="w-full p-3 border border-gray-200 rounded-xl bg-gray-200 text-gray-500 font-mono">
                            {formData.macAddress || 'Belum diatur'}
                        </p>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Nama Jaringan (SSID)
                        </label>
                        <p className="w-full p-3 border border-gray-200 rounded-xl bg-gray-200 text-gray-500">
                            {formData.ssid || 'Belum diatur'}
                        </p>
                    </div>
                    <div className="flex justify-between items-center pt-6 border-t border-gray-200 mt-8">
                        <motion.button type="button" onClick={handleDelete} className="px-6 py-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 font-semibold shadow-sm">Hapus Alat</motion.button>
                        <div className="space-x-3"><motion.button type="button" onClick={onClose} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold shadow-md">Batal</motion.button><motion.button type="submit" className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold shadow-md">Simpan Perubahan</motion.button></div>
                    </div>
                </form>
            </div>
        </div>
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={onClose}>
            <div variants={modalVariants} initial="hidden" animate="visible" exit="hidden" className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">{jadwalToEdit ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}</h2>
                <form onSubmit={handleSave} className="space-y-4">
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
            </div>
        </div>
    );
};

// --- Komponen Modal Kontrol Dosing ---
const ModalKontrolDosing = ({ alat, onClose, onEdit }) => {
    const [settings, setSettings] = useState({

        targetPPM: '', pumpDuration_sec: '', checkInterval_sec: '',

        startTime_hour: '', endTime_hour: '', dailyPumpLimit: ''

    });

   

    const [originalSettings, setOriginalSettings] = useState(null);

    const [isSaving, setIsSaving] = useState(false);

    const [isLoadingSettings, setIsLoadingSettings] = useState(true);



    // State Sensor & Status Pompa

    // Kita inisialisasi dengan null, tapi nanti langsung diisi data terakhir dari API

    const [realtimeData, setRealtimeData] = useState({ tds_air: null, suhu_air: null });

    const [isLoadingRealtime, setIsLoadingRealtime] = useState(true);

    const [socketStatus, setSocketStatus] = useState("Menghubungkan...");

    const [isOnline, setIsOnline] = useState(false);

   

    // Switch A & B

    const [switchA, setSwitchA] = useState(false);

    const [switchB, setSwitchB] = useState(false);



 // 1. Initial Data Fetch & Socket Connection

    // 1. Initial Data Fetch & Socket Connection

    useEffect(() => {

        if (!alat.id) return;



        // A. Fetch Data Awal (Biarkan bagian ini seperti kode Anda sebelumnya)

        const fetchInitialData = async () => {

            setIsLoadingSettings(true);

            try {

                // ... (Logika fetch settings & data terakhir biarkan sama) ...

                // Pastikan kode fetch API Anda tetap ada di sini

                // Saya ringkas agar fokus ke perbaikan error socket

                const resSettings = await api.get(`/alat/${alat.id}/dosing-settings`);

                if (resSettings.data) {

                     const parseHour = (t) => t ? parseInt(t.split(':')[0], 10) : '';

                     setSettings(prev => ({

                        ...prev, ...resSettings.data,

                        startTime_hour: parseHour(resSettings.data.startTime),

                        endTime_hour: parseHour(resSettings.data.endTime)

                     }));

                     setOriginalSettings(resSettings.data);

                }

                const resHistory = await api.get(`/alat/${alat.id}/dosing-data?limit=1`);

                if (resHistory.data?.data?.length > 0) {

                    setRealtimeData({

                        tds_air: parseFloat(resHistory.data.data[0].tds_air),

                        suhu_air: parseFloat(resHistory.data.data[0].suhu_air)

                    });

                    setIsLoadingRealtime(false);

                    setSocketStatus("Offline (Data Terakhir)");

                    setIsOnline(false);

                }

            } catch (error) {

                console.error(error);

            } finally {

                setIsLoadingSettings(false);

            }

        };

        fetchInitialData();



        // B. --- PERBAIKAN UTAMA DI SINI (SOCKET) ---

        const socketUrl = `http://${window.location.hostname}:5000`;

        const socket = io(socketUrl);



        // 1. DEFINISIKAN HELPER DI PALING ATAS (Agar bisa dibaca semua listener)

        const normalizeMac = (mac) => mac ? mac.toString().toLowerCase().replace(/[:-]/g, "") : "";

        const currentAlatMac = normalizeMac(alat.macAddress);



        socket.on("connect", () => {

            console.log("✅ Socket Terhubung");

            setSocketStatus("Menunggu Sensor...");

            setIsOnline(true);

            socket.emit("join_room", alat.macAddress);

        });



        socket.on("disconnect", () => {

            setSocketStatus("Offline");

            setIsOnline(false);

        });



        socket.on("connect_error", () => {

            setSocketStatus("Offline (Server Down)");

            setIsOnline(false);

        });



        // 2. PERBAIKAN VARIABEL payloadMac

        socket.on("update_tds", (payload) => {

            // Error Anda terjadi karena baris ini hilang/salah posisi sebelumnya:

            const payloadMac = normalizeMac(payload.mac);



            if (!payload.mac || payloadMac === currentAlatMac) {

                const val = payload.value !== undefined ? payload.value : payload;

                setRealtimeData(prev => ({ ...prev, tds_air: parseFloat(val) }));

                setIsLoadingRealtime(false);

                setSocketStatus("Real-time Sensor");

                setIsOnline(true);

            }

        });



        socket.on("update_suhu", (payload) => {

            // Error terjadi lagi jika baris ini lupa dicopy ke listener suhu:

            const payloadMac = normalizeMac(payload.mac);



            if (!payload.mac || payloadMac === currentAlatMac) {

                const val = payload.value !== undefined ? payload.value : payload;

                setRealtimeData(prev => ({ ...prev, suhu_air: parseFloat(val) }));

                setIsLoadingRealtime(false);

                setSocketStatus("Real-time Sensor");

                setIsOnline(true);

            }

        });



        // Update Status Pompa

        socket.on("update_pompa_a", (status) => {

            const isOn = (status === 'ON' || status === "1" || status === 1 || status === true);

            setSwitchA(isOn);

        });



        socket.on("update_pompa_b", (status) => {

            const isOn = (status === 'ON' || status === "1" || status === 1 || status === true);

            setSwitchB(isOn);

        });



        return () => {

            socket.disconnect();

        };



    }, [alat.id, alat.macAddress]);



    const hoursOptions = Array.from({ length: 24 }, (_, i) => (

        <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>

    ));



    // Handle Save Settings

        const handleSaveSettings = async () => {

            if (isSaving) return;

            const formatTime = (hour) => {

            if (hour === '' || hour === null) return null;

            return `${String(hour).padStart(2, '0')}:00:00`;

        };



        const currentData = {

            targetPPM: settings.targetPPM,

            pumpDuration_sec: settings.pumpDuration_sec,

            checkInterval_sec: settings.checkInterval_sec,

            startTime: formatTime(settings.startTime_hour),

            endTime: formatTime(settings.endTime_hour),

            dailyPumpLimit: settings.dailyPumpLimit

        };



        const originalData = {

            targetPPM: originalSettings?.targetPPM,

            pumpDuration_sec: originalSettings?.pumpDuration_sec,

            checkInterval_sec: originalSettings?.checkInterval_sec,

            startTime_hour: originalSettings?.startTime_hour,

            endTime_hour: originalSettings?.endTime_hour,

            dailyPumpLimit: originalSettings?.dailyPumpLimit

        };



        if (JSON.stringify(currentData) === JSON.stringify(originalData)) {

            toast.success("Pengaturan sudah disimpan.");

            return;

        }



        const fieldsToValidate = [

            { key: 'targetPPM', label: 'Target PPM', strictPositive: true },

            { key: 'pumpDuration_sec', label: 'Durasi Pompa', strictPositive: true },

            { key: 'checkInterval_sec', label: 'Interval Cek', strictPositive: true },

            { key: 'dailyPumpLimit', label: 'Limit Pompa Harian', strictPositive: true },

            { key: 'startTime_hour', label: 'Jam Mulai', strictPositive: false },

            { key: 'endTime_hour', label: 'Jam Selesai', strictPositive: false }

        ];



        for (let field of fieldsToValidate) {

            const val = settings[field.key];

            if (val === '' || val === null || val === undefined) {

                toast.error(`${field.label} tidak boleh kosong`);

                return;

            }

            if (field.strictPositive && Number(val) <= 0) {

                toast.error(`${field.label} tidak boleh 0 atau negatif`);

                return;

            }

        }



        setIsSaving(true);

        try {

            await api.patch(`/alat/${alat.id}/dosing-settings`, currentData);

            toast.success('Pengaturan berhasil disimpan!');

            setOriginalSettings(currentData);

        } catch (error) {

            toast.error('Gagal menyimpan pengaturan.');

            console.error(error);

        } finally {

            setIsSaving(false);

        }

    };



    // Handle Manual Pump

    const handleTogglePump = async (pump) => {

        const targetState = (pump === 'a') ? !switchA : !switchB;

       

        // 1. Optimistic Update

        if (pump === 'a') setSwitchA(targetState);

        else setSwitchB(targetState);



        // 2. Kirim API

        const pumpTarget = (pump === 'a') ? 'pumpA' : 'pumpB';

        const valueToSend = targetState ? "1" : "0";



        try {

            await api.post(`/alat/${alat.id}/dosing-manual`, {

                target: pumpTarget,

                value: valueToSend

            });

        } catch (error) {

            toast.error(`Gagal kontrol pompa: ${error.message}`);

            // Gagal -> Rollback

            if (pump === 'a') setSwitchA(!targetState);

            else setSwitchB(!targetState);

        }

    };



    const handleSettingChange = (e) => {

        const { name, value } = e.target;

        if (value === '') {

            if (name === 'checkInterval_min') {

                setSettings(prev => ({ ...prev, checkInterval_sec: '' }));

            } else {

                setSettings(prev => ({ ...prev, [name]: '' }));

            }

            return;

        }

        if (name === 'checkInterval_min') {

            setSettings(prev => ({ ...prev, checkInterval_sec: Number(value) * 60 }));

        } else {

            setSettings(prev => ({ ...prev, [name]: Number(value) }));

        }

    };



    const checkIntervalInMinutes = settings.checkInterval_sec === '' ? '' : Math.round(settings.checkInterval_sec / 60);



    return (

        <>

            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">

                <div className="bg-gray-50 w-full h-full max-w-6xl rounded-xl shadow-xl flex flex-col overflow-hidden">



                    {/* --- Header --- */}

                    <div className="flex-shrink-0 flex justify-between items-center border-b border-gray-200 p-5 bg-white">

                        <div>

                            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">

                                <FaTint className="text-blue-600" />

                                Kontrol Dosing Nutrisi

                            </h2>

                            <p className="text-sm text-gray-500 mt-1">

                                {alat.nama} • {alat.lokasi}

                            </p>

                        </div>

                        <div className="flex items-center gap-2">

                            <button onClick={() => onEdit(alat)} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors flex items-center gap-2">

                                <FaCog className="text-sm" /> Edit Info

                            </button>

                            <button onClick={onClose} className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors">

                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">

                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />

                                </svg>

                            </button>

                        </div>

                    </div>



                    {/* --- Body Grid --- */}

                    <div className="flex-grow p-5 overflow-auto grid grid-cols-1 lg:grid-cols-3 gap-5">



                        {/* == KOLOM KIRI == */}

                        <div className="lg:col-span-1 space-y-5">

                            <div className="bg-white rounded-lg shadow border border-gray-200 p-5">

                                <h3 className="text-lg font-bold text-gray-800 mb-4 pb-3 border-b border-gray-200 flex items-center gap-2">

                                    <FaChartLine className="text-blue-600" />

                                    Status Real-Time

                                </h3>

                                {isLoadingRealtime ? (

                                    <div className="flex flex-col items-center justify-center py-8 gap-3">

                                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>

                                        <span className="text-xs text-gray-400">Mengambil data terakhir...</span>

                                    </div>

                                ) : (

                                    <div className="space-y-3">

                                        <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">

                                            <div className="p-2 bg-green-500 rounded-lg">

                                                <FaCrosshairs className="text-white h-6 w-6" />

                                            </div>

                                            <div className="flex-grow">

                                                <span className="text-xs font-medium text-gray-600">PPM Saat Ini</span>

                                                <p className="text-2xl font-bold text-gray-800">

                                                    {/* Jika data masih null (belum ada di DB dan Socket belum kirim), tampilkan 0 atau - */}

                                                    {realtimeData.tds_air !== null ? realtimeData.tds_air.toFixed(0) : "0"}

                                                    <span className="text-sm font-medium text-gray-600"> PPM</span>

                                                </p>

                                            </div>

                                        </div>

                                        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">

                                            <div className="p-2 bg-blue-500 rounded-lg">

                                                <FaThermometerHalf className="text-white h-6 w-6" />

                                            </div>

                                            <div className="flex-grow">

                                                <span className="text-xs font-medium text-gray-600">Suhu Air</span>

                                                <p className="text-2xl font-bold text-gray-800">

                                                    {realtimeData.suhu_air !== null ? realtimeData.suhu_air.toFixed(1) : "0"}

                                                    <span className="text-sm font-medium text-gray-600"> °C</span>

                                                </p>

                                            </div>

                                        </div>

                                        {/* --- KODE BARU (Status Hijau/Merah) --- */}

                                        <div className={`p-3 rounded-lg border-l-4 transition-colors duration-300 ${

                                            isOnline

                                                ? 'bg-green-100 border-green-500' // Jika Online: Hijau

                                                : 'bg-red-100 border-red-500'     // Jika Offline: Merah

                                        }`}>

                                            <p className={`text-xs flex items-center gap-2 font-bold ${

                                                isOnline ? 'text-green-800' : 'text-red-800'

                                            }`}>

                                                {/* Ikon otomatis berubah: Centang atau Tanda Seru */}

                                                {isOnline ? <FaCheckCircle /> : <FaExclamationCircle />}

                                                {socketStatus}

                                            </p>

                                        </div>

                                    </div>

                                )}

                            </div>



                            <div className="bg-white rounded-lg shadow border border-gray-200 p-5">

                                <h3 className="text-lg font-bold text-gray-800 mb-4 pb-3 border-b border-gray-200 flex items-center gap-2">

                                    <FaPowerOff className="text-purple-600" />

                                    Kontrol Pompa Manual

                                </h3>

                                <div className="space-y-4">

                                    <p className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">

                                        <strong>Perhatian:</strong> Tombol ini berfungsi sebagai Saklar ON/OFF. Pastikan mematikan pompa setelah selesai.

                                    </p>

                                   

                                    {/* Switch A */}

                                    <div className={`flex items-center justify-between p-3 rounded-lg border ${switchA ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>

                                        <div className="flex items-center gap-3">

                                            <div className={`p-2 rounded-full ${switchA ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-500'}`}>

                                                <FaTint />

                                            </div>

                                            <div>

                                                <p className="font-bold text-gray-700 text-sm">Pompa A</p>

                                                <p className="text-xs text-gray-500">{switchA ? 'Status: MENYALA' : 'Status: MATI'}</p>

                                            </div>

                                        </div>

                                        <button onClick={() => handleTogglePump('a')} className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none ${switchA ? 'bg-blue-600' : 'bg-gray-300 hover:bg-gray-400'}`}>

                                            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${switchA ? 'translate-x-6' : 'translate-x-0'}`} />

                                        </button>

                                    </div>



                                    {/* Switch B */}

                                    <div className={`flex items-center justify-between p-3 rounded-lg border ${switchB ? 'bg-cyan-50 border-cyan-200' : 'bg-gray-50 border-gray-200'}`}>

                                        <div className="flex items-center gap-3">

                                            <div className={`p-2 rounded-full ${switchB ? 'bg-cyan-500 text-white' : 'bg-gray-300 text-gray-500'}`}>

                                                <FaTint />

                                            </div>

                                            <div>

                                                <p className="font-bold text-gray-700 text-sm">Pompa B</p>

                                                <p className="text-xs text-gray-500">{switchB ? 'Status: MENYALA' : 'Status: MATI'}</p>

                                            </div>

                                        </div>

                                        <button onClick={() => handleTogglePump('b')} className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none ${switchB ? 'bg-cyan-600' : 'bg-gray-300 hover:bg-gray-400'}`}>

                                            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${switchB ? 'translate-x-6' : 'translate-x-0'}`} />

                                        </button>

                                    </div>

                                </div>

                            </div>

                        </div>



                        {/* == KOLOM KANAN: PENGATURAN OTOMATIS == */}

                        <div className="lg:col-span-2">

                            <div className="bg-white rounded-lg shadow border border-gray-200 p-6 h-full">

                                <h3 className="text-xl font-bold text-gray-800 mb-5 pb-3 border-b border-gray-200 flex items-center gap-2">

                                    <FaCog className="text-blue-600" />

                                    Pengaturan Dosing Otomatis

                                </h3>



                                {isLoadingSettings ? (

                                    <div className="flex items-center justify-center py-12">

                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>

                                    </div>

                                ) : (

                                    <div className="space-y-5">

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                                            {/* Jam Operasi */}

                                            <div className="md:col-span-2 bg-purple-50 border border-purple-200 p-5 rounded-lg">

                                                <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2 text-sm">

                                                    <FaClock className="text-purple-600" /> Jam Operasi Otomatis

                                                </h4>

                                                <div className="grid grid-cols-2 gap-3">

                                                    <div>

                                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Jam Mulai</label>

                                                        <select name="startTime_hour" value={settings.startTime_hour} onChange={handleSettingChange} className="w-full p-2 border border-purple-300 rounded-lg bg-white font-semibold text-gray-800 focus:ring-2 focus:ring-purple-500 focus:outline-none">

                                                            <option value="">Pilih</option>

                                                            {hoursOptions}

                                                        </select>

                                                    </div>

                                                    <div>

                                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Jam Selesai</label>

                                                        <select name="endTime_hour" value={settings.endTime_hour} onChange={handleSettingChange} className="w-full p-2 border border-purple-300 rounded-lg bg-white font-semibold text-gray-800 focus:ring-2 focus:ring-purple-500 focus:outline-none">

                                                            <option value="">Pilih</option>

                                                            {hoursOptions}

                                                            <option value={0}>24:00</option>

                                                        </select>

                                                    </div>

                                                </div>

                                            </div>



                                            {/* Target PPM */}

                                            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">

                                                <label className="block text-xs font-bold text-gray-700 mb-2 flex items-center gap-2">

                                                    <FaCrosshairs className="text-green-600" /> Target PPM

                                                </label>

                                                <div className="flex items-center gap-2">

                                                    <input type="number" min="300" max="2500" step="50" name="targetPPM" value={settings.targetPPM} onChange={handleSettingChange} className="w-full p-2 border border-green-300 rounded-lg bg-white font-bold text-xl text-gray-800 focus:ring-2 focus:ring-green-500 focus:outline-none" />

                                                    <span className="font-bold text-gray-600">PPM</span>

                                                </div>

                                            </div>



                                            {/* Durasi Pompa */}

                                            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">

                                                <label className="block text-xs font-bold text-gray-700 mb-2 flex items-center gap-2">

                                                    <FaTint className="text-blue-600" /> Durasi Pompa

                                                </label>

                                                <div className="flex items-center gap-2">

                                                    <input type="number" min="1" max="30" step="1" name="pumpDuration_sec" value={settings.pumpDuration_sec} onChange={handleSettingChange} className="w-full p-2 border border-blue-300 rounded-lg bg-white font-bold text-xl text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none" />

                                                    <span className="font-bold text-gray-600">detik</span>

                                                </div>

                                            </div>



                                            {/* Interval Cek */}

                                            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">

                                                <label className="block text-xs font-bold text-gray-700 mb-2 flex items-center gap-2">

                                                    <FaClock className="text-amber-600" /> Interval Cek

                                                </label>

                                                <div className="flex items-center gap-2">

                                                    <input type="number" min="1" max="60" step="1" name="checkInterval_min" value={checkIntervalInMinutes} onChange={handleSettingChange} className="w-full p-2 border border-amber-300 rounded-lg bg-white font-bold text-xl text-gray-800 focus:ring-2 focus:ring-amber-500 focus:outline-none" />

                                                    <span className="font-bold text-gray-600">menit</span>

                                                </div>

                                            </div>



                                            {/* Limit Harian */}

                                            <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-lg">

                                                <label className="block text-xs font-bold text-gray-700 mb-2 flex items-center gap-2">

                                                    <FaPowerOff className="text-indigo-600" /> Limit Pompa Harian

                                                </label>

                                                <div className="flex items-center gap-2">

                                                    <input type="number" name="dailyPumpLimit" min="0" max="100" value={settings.dailyPumpLimit} onChange={handleSettingChange} className="w-full p-2 border border-indigo-300 rounded-lg bg-white font-bold text-xl text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />

                                                    <span className="font-bold text-gray-600">kali</span>

                                                </div>

                                            </div>

                                        </div>



                                        <button

                                            onClick={handleSaveSettings}

                                            disabled={isSaving}

                                            className={`w-full py-3 rounded-lg font-bold shadow transition-colors flex items-center justify-center gap-2 ${

                                                isSaving ? 'bg-gray-400 cursor-not-allowed text-white' : 'bg-green-600 hover:bg-green-700 text-white'

                                            }`}

                                        >

                                            {isSaving ? (

                                                <>

                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>

                                                    Menyimpan...

                                                </>

                                            ) : (

                                                <>

                                                    <FaSave /> Simpan Pengaturan Otomatis

                                                </>

                                            )}

                                        </button>

                                    </div>

                                )}

                            </div>

                        </div>



                    </div>

                </div>

            </div>

        </>

    );

};

// --- Komponen Modal Kontrol Irigasi ---
const ModalKontrolIrigasi = ({ alat, onClose, onEdit }) => {
    const [daftarJadwal, setDaftarJadwal] = useState([]);
    const [isLoadingJadwal, setIsLoadingJadwal] = useState(true);
    const [isFormJadwalVisible, setIsFormJadwalVisible] = useState(false);
    const [jadwalToEdit, setJadwalToEdit] = useState(null);
    const [solenoidTerpilihManual, setSolenoidTerpilihManual] = useState([]);

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

    const handleEditJadwal = (jadwal) => {
        setJadwalToEdit(jadwal);
        setIsFormJadwalVisible(true);
    };

    const handleSimpanJadwal = async (jadwalBaru) => {
        if (jadwalBaru.id) {
            try {
                const response = await api.patch(`/jadwal/${jadwalBaru.id}`, jadwalBaru);
                setDaftarJadwal(prev => 
                    prev.map(j => j.id === jadwalBaru.id ? response.data : j)
                );
                toast.success("Jadwal berhasil diperbarui!");
            } catch (error) {
                toast.error("Gagal memperbarui jadwal.");
                console.error("Error updating schedule:", error);
            }
        } else {
            try {
                const response = await api.post(`/alat/${alat.id}/jadwal`, jadwalBaru);
                setDaftarJadwal(prev => [...prev, response.data]);
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

    return (
        <>
            <div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
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
                        {/* ... (bagian Kontrol Manual) ... */}
                    </div>
                </div>
            </div>
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
    const [daftarAlat, setDaftarAlat] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

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

        const handleDeviceUpdate = () => {
            console.log("Menerima sinyal pembaruan dari server, memuat ulang data alat...");
            fetchAlat();
        };

        socket.on('device-update', handleDeviceUpdate);

        return () => {
            socket.off('device-update', handleDeviceUpdate);
        };
    }, []); 

    const handleTambahAlat = async (alatBaru) => {
        try {
            const response = await api.post('/alat', alatBaru);
            setDaftarAlat([...daftarAlat, response.data.device]);
        } catch (error) {
            toast.error("Gagal menambahkan alat baru.");
            console.error("Error adding tool: ", error);
            if (error.response) {
                console.error("Data Error:", error.response.data);
            }
        }
    };

    const handleLihatDetail = (alat) => setSelectedAlat(alat);
    
    const handleEdit = (alat) => {
        setSelectedAlat(null);
        setTimeout(() => {
            setAlatToEdit(alat);
        }, 300);
    };
    
    const handleUpdateAlat = async (updatedAlat) => {
        try {
            await api.patch(`/alat/${updatedAlat.id}`, updatedAlat);
            setDaftarAlat(daftarAlat.map(alat =>
                alat.id === updatedAlat.id ? updatedAlat : alat
            ));
            setAlatToEdit(null);
            toast.success("Alat berhasil diperbarui!");
        } catch (error) {
            toast.error("Gagal memperbarui alat.");
            console.error("Error updating tool:", error);
        }
    };
    
    const handleHapusAlat = async (idAlat) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus alat ini?')) {
            try {
                await api.delete(`/alat/${idAlat}`);
                setDaftarAlat(prev => prev.filter(a => a.id !== idAlat));
                toast.success('Alat berhasil dihapus!');
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
                                <p>Loading data...</p>
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
                            {selectedAlat && selectedAlat.jenis === 'Smart Irrigation' && (
                                <ModalKontrolIrigasi alat={selectedAlat} onClose={() => setSelectedAlat(null)} onEdit={handleEdit} />
                            )}
                            {selectedAlat && selectedAlat.jenis === 'Climate' && (
                                <ModalKontrolClimate alat={selectedAlat} onClose={() => setSelectedAlat(null)} onEdit={handleEdit} />
                            )}
                            {selectedAlat && selectedAlat.jenis === 'Dosing' && (
                                <ModalKontrolDosing alat={selectedAlat} onClose={() => setSelectedAlat(null)} onEdit={handleEdit} />
                            )}
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