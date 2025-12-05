import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { FaFan, FaThermometerHalf, FaPowerOff, FaQrcode, FaImage } from 'react-icons/fa';
import QrScannerLib from 'qr-scanner';
import api from '../api';
import MainLayout from '../components/MainLayout';
import QrScanner from '../components/QrScanner';

const socket = io(`http://localhost:3020`);

// --- Komponen Kartu Alat ---
const AlatCard = ({ alat, onClick }) => { 
    const { nama, jenis } = alat;
    return (
        <div layoutid={`card-container-${alat.id}`} className="bg-white rounded-2xl shadow-lg overflow-hidden transform hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col min-h-[180px]" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} whilehover={{ scale: 1.03 }} whiletap={{ scale: 0.97 }} onClick={onClick} >
            <div className="p-6 flex-grow">
                <div className="flex justify-between items-start">
                    <div>
                        <span className="text-gray-500 text-sm font-medium">{nama}</span>
                        <h2 className="text-xl font-bold text-gray-800 mt-1">{jenis}</h2>
                    </div>
                </div>
            </div>
            <div className="bg-gray-50 px-6 py-3 mt-auto">
                <span className="text-green-600 font-semibold text-sm hover:underline">
                    Lihat Detail →
                </span>
            </div>
        </div>
    );
};

// --- Komponen Form Tambah Alat ---
const FormTambahAlat = ({ onClose, onTambahAlat }) => {
    const jenisOptions = ['Smart Irrigation', 'Climate', 'Dosing'];
    const [namaAlat, setNamaAlat] = useState('');
    const [lokasiAlat, setLokasiAlat] = useState('');

    // State untuk ID lengkap dari hasil scan/ketik
    const [fullDeviceId, setFullDeviceId] = useState(''); 

    // State untuk menyimpan hasil parsing ID
    const [detectedType, setDetectedType] = useState(null);
    const [detectedMac, setDetectedMac] = useState(null);
    
    // ... sisa state
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const fileInputRef = useRef(null);

    const deviceTypeMapping = {
        'Smart Irrigation': 'IRRIGATION',
        'Climate': 'CLIMATE',
        'Dosing': 'DOSING'
    };
    
    const handleFileScan = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const notif = toast.loading("Menganalisis gambar QR Code...");
        try {
            const result = await QrScannerLib.scanImage(file, { returnDetailedScanResult: true });
            setFullDeviceId(result.data); 
            toast.success("MAC Address berhasil dipindai!", { id: notif });
        } catch (error) {
            console.error(error);
            toast.error("QR Code tidak ditemukan di gambar.", { id: notif });
        }
        // Reset input file agar bisa memilih file yang sama lagi
        event.target.value = null; 
    };

    const displayNameMapping = {
    IRRIGATION: 'Smart Irrigation',
    CLIMATE: 'Climate',
    DOSING: 'Dosing'
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validasi utama: pastikan ID sudah terdeteksi dengan benar
        if (!detectedType || !detectedMac) {
            toast.error('Format ID Alat tidak valid. Harap periksa kembali.');
            return;
        }

        // Format MAC Address ke bentuk standar (dengan titik dua) untuk dikirim ke backend
        const formattedMacAddress = detectedMac.match(/.{1,2}/g).join(':').toUpperCase();

        // Kirim data yang sudah bersih dan terstruktur
        onTambahAlat({
            nama: namaAlat,
            lokasi: lokasiAlat,
            macAddress: formattedMacAddress, // <-- MAC yang sudah diformat
            deviceType: detectedType,        // <-- Tipe yang terdeteksi
            jenis: displayNameMapping[detectedType] || detectedType // <-- Nama tampilan
        });

        toast.success(`Alat ${displayNameMapping[detectedType]} berhasil ditambahkan!`);
        onClose();
    };
    
    const handleScanSuccess = (scannedData) => {
        setFullDeviceId(scannedData);
        setIsScannerOpen(false);
        toast.success('ID Alat berhasil dipindai!', {
            id: 'scan-success-toast', // Beri ID unik
        });
    };

    useEffect(() => {
    // Coba pecah ID berdasarkan tanda '-'
    const parts = fullDeviceId.split('-');

    // Jika formatnya benar (contoh: "CLIMATE-XXXXXXXXXXXX")
    if (parts.length === 2 && parts[0] && parts[1]) {
        const type = parts[0].toUpperCase(); // Ambil bagian pertama (CLIMATE)
        const mac = parts[1]; // Ambil bagian kedua (MAC Address)
        
        // Cek apakah tipenya valid (opsional tapi bagus)
        const validTypes = ['IRRIGATION', 'CLIMATE', 'DOSING'];
        if (validTypes.includes(type)) {
            setDetectedType(type);
            setDetectedMac(mac);
            return; // Berhasil, hentikan fungsi
        }
    }

    // Jika format salah atau tidak valid, reset state
    setDetectedType(null);
    setDetectedMac(null);

    }, [fullDeviceId]);
    
    const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
    const modalVariants = { hidden: { y: "-50px", opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 30 } }, exit: { opacity: 0, scale: 0.9, transition: { duration: 0.15 } } };
    
    return (
        <>
            <motion.div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" variants={backdropVariants} initial="hidden" animate="visible" exit="hidden" onClick={onClose}>
                <div className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-3xl shadow-xl border border-gray-100 w-full max-w-lg relative w-full max-w-lg bg-white rounded-2xl shadow-xl flex flex-col max-h-[90vh]" variants={modalVariants} initial="hidden" animate="visible" exit="exit" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-6 border-b pb-4 border-gray-200"><h2 className="text-3xl font-extrabold text-gray-800">Tambahkan Alat Baru</h2><button onClick={onClose} className="p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-all duration-200 focus:outline-none"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button></div>
                    <form onSubmit={handleSubmit} className="sp-6 flex-1 overflow-y-auto">
                        <div><label className="block text-sm font-semibold text-gray-700 mb-1">Nama Alat</label><input required type="text" value={namaAlat} onChange={(e) => setNamaAlat(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Masukkan nama alat" /></div>
                        {/* <div className="relative"><label className="block text-sm font-semibold text-gray-700 mb-1">Jenis Alat</label><select value={jenisAlat} onChange={(e) => setJenisAlat(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none pr-8">{jenisOptions.map(option => (<option key={option} value={option}>{option}</option> ))}</select><div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pt-6 px-4 text-gray-700"><svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg></div></div> */}
                        <div><label className="block text-sm font-semibold text-gray-700 mb-1">Lokasi Alat</label><input required type="text" value={lokasiAlat} onChange={(e) => setLokasiAlat(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-italic" placeholder="Sukawening, Dramaga" /></div>
                        
                        {/* MAC Address Field with Scan Button */}
                        {/* <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                MAC Address Perangkat
                            </label>
                            <div className="flex flex-col space-y-2">
                                <input
                                type="text"
                                value={macAddress}
                                readOnly // <-- Tambahkan properti ini untuk membuatnya read-only
                                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-100 text-gray-600 font-mono cursor-default focus:outline-none" // Style disesuaikan agar terlihat non-aktif
                                placeholder="Pindai untuk mengisi..." // Placeholder diubah karena tidak bisa diketik manual
                            />
                                <button
                                    type="button"
                                    onClick={() => setIsScannerOpen(true)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors duration-300 shadow-sm"
                                    aria-label="Pindai QR Code untuk MAC Address"
                                >
                                    <FaQrcode className="h-5 w-5" />
                                    <span>Pindai Alat</span>
                                </button> */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        ID Unik Alat
                                    </label>
                                    <div className="flex flex-col space-y-2">
                                        <input
                                            type="text"
                                            value={fullDeviceId}
                                            onChange={(e) => setFullDeviceId(e.target.value)}
                                            className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
                                            placeholder="Pindai atau ketik ID Alat (contoh: CLIMATE-XXXXXXXXXXXX)"
                                            required
                                        />

                                        {/* --- TAMBAHKAN TAMPILAN FEEDBACK INI --- */}
                                        {detectedType && (
                                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
                                                <p className="font-semibold text-green-800">
                                                    Jenis Alat Terdeteksi: <span className="font-bold">{detectedType}</span>
                                                </p>
                                                <p className="text-gray-600 font-mono">
                                                    MAC Address: {detectedMac}
                                                </p>
                                            </div>
                                        )}
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
                <div layoutid={`card-container-${alat.id}`} className="bg-gray-100 w-full h-full max-w-4xl rounded-2xl shadow-2xl flex flex-col overflow-hidden">
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

// --- [UPDATED] Komponen Modal Edit Alat ---
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
            <div className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-3xl shadow-xl border border-gray-100 w-full max-w-lg relative w-full max-w-lg bg-white rounded-2xl shadow-xl flex flex-col max-h-[90vh]" variants={modalVariants} initial="hidden" animate="visible" exit="exit" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6 border-b pb-4 border-gray-200"><h2 className="text-3xl font-extrabold text-gray-800">Edit Alat</h2><button onClick={onClose} className="p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-all duration-200 focus:outline-none"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button></div>
                <form onSubmit={handleUpdate} className="p-6 flex-1 overflow-y-auto">
                    <div><label className="block text-sm font-semibold text-gray-700 mb-1">Nama Alat</label><input required type="text" name="nama" value={formData.nama} onChange={handleChange} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"/></div>
                    <div className="relative"><label className="block text-sm font-semibold text-gray-700 mb-1">Jenis Alat</label><p className="w-full p-3 border border-gray-200 rounded-xl bg-gray-200 text-gray-500 font-mono">
                            {formData.jenis || 'Belum diatur'}
                        </p><div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pt-6 px-4 text-gray-700"></div></div>
                    <div><label className="block text-sm font-semibold text-gray-700 mb-1">Lokasi Alat</label><input required type="text" name="lokasi" value={formData.lokasi} onChange={handleChange} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"/></div>
                    
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
                    <div className="flex flex-col-reverse md:flex-row md:justify-between items-center gap-4 pt-6 border-t border-gray-200 mt-8">

                            <motion.button 
                                type="button" 
                                onClick={handleDelete} 
                                className="w-full md:w-auto px-6 py-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 font-semibold shadow-sm"
                            >
                                Hapus Alat
                            </motion.button>
                            
                            <motion.button 
                                type="submit" 
                                className="w-full sm:w-auto px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold shadow-sm"
                            >
                                Simpan Perubahan
                            </motion.button>
                            <motion.button 
                                type="button" 
                                onClick={onClose} 
                                className="w-full sm:w-auto px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold shadow-sm"
                            >
                                Batal
                            </motion.button>
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
           <div 
                variants={modalVariants} 
                initial="hidden" 
                animate="visible" 
                exit="hidden" 
                className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden" 
                onClick={e => e.stopPropagation()}
            >
               <div className="p-6 border-b flex-shrink-0">
                    <h2 className="text-xl font-bold">{jadwalToEdit ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}</h2>
                </div>
                <form onSubmit={handleSave} className="flex-1 flex flex-col overflow-hidden">
                <div className="p-6 space-y-4 flex-1 overflow-y-auto">
                    <div><label className="block text-sm font-medium">Nama Jadwal (Opsional)</label><input type="text" value={jadwal.nama} onChange={e => setJadwal(prev => ({ ...prev, nama: e.target.value }))} placeholder="cth: Penyiraman Pagi" className="mt-1 w-full p-2 border rounded-md"/></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium">Tanggal Mulai <span className="text-red-500">*</span></label><input required type="date" value={jadwal.tanggalMulai} onChange={e => setJadwal(prev => ({ ...prev, tanggalMulai: e.target.value }))} className="mt-1 w-full p-2 border rounded-md"/></div>
                        <div><label className="block text-sm font-medium">Tanggal Selesai <span className="text-red-500">*</span></label><input required type="date" value={jadwal.tanggalSelesai} onChange={e => setJadwal(prev => ({ ...prev, tanggalSelesai: e.target.value }))} className="mt-1 w-full p-2 border rounded-md"/></div>
                    </div>
                    <div><label className="block text-sm font-medium">Waktu Penyiraman <span className="text-red-500">*</span></label>{jadwal.waktu.map((w, index) => (<div key={index} className="flex items-center gap-2 mt-2"><input required type="time" value={w} onChange={e => handleWaktuChange(index, e.target.value)} className="w-full p-2 border rounded-md"/>{jadwal.waktu.length > 1 && <button type="button" onClick={() => hapusWaktu(index)} className="p-2 bg-red-100 text-red-600 rounded-full">✕</button>}</div>))}<button type="button" onClick={tambahWaktu} className="mt-2 text-sm text-green-600 font-semibold">+ Tambah Waktu</button></div>
                    <div><label className="block text-sm font-medium">Durasi Menyala (Menit) <span className="text-red-500">*</span></label><input required type="number" value={jadwal.durasi} onChange={e => setJadwal(prev => ({ ...prev, durasi: parseInt(e.target.value) || 0 }))} min="1" className="mt-1 w-full p-2 border rounded-md"/></div>
                    <div><label className="block text-sm font-medium">Pilih Solenoid <span className="text-red-500">*</span></label><div className="flex flex-wrap gap-2 mt-2">{[1, 2, 3, 4, 5, 6].map(id => <button type="button" key={id} onClick={() => handleSolenoidToggle(id)} className={`px-3 py-1 rounded-full ${jadwal.solenoid.includes(id) ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>Solenoid {id}</button>)}<button type="button" onClick={handlePilihSemuaSolenoid} className="px-3 py-1 rounded-full bg-green-100 text-green-800 font-semibold">Pilih Semua</button></div></div>
                    <div className="flex justify-end gap-3 p-6 border-t flex-shrink-0"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg">Batal</button><button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Simpan</button></div>
                </div>
                </form>
            </div>
        </div>
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
        if (!scheduleId) return;
        if (!window.confirm('Menghapus jadwal ini akan menghapusnya dari SEMUA alat yang menggunakannya. Lanjutkan?')) return;

        try {
            // Beberapa backend mengharapkan body pada DELETE (axios: second arg { data: ... })
            await api.delete(`/jadwal/${scheduleId}`, { data: { alatId: alat?.id } });

            setDaftarJadwal(prev => prev.filter(j => j.id !== scheduleId));
            toast.success('Jadwal berhasil dihapus!');
        } catch (error) {
            // Tampilkan detail supaya mudah diagnosa (server often returns HTML stack trace)
            console.error('Error deleting schedule:', error);
            console.error('Server response data:', error.response?.data);
            toast.error('Gagal menghapus jadwal. Periksa console & log backend.');
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
            // Ambil pesan error dari response backend, jika tidak ada, gunakan pesan default
            const errorMessage = error.response?.data?.message || "Gagal menambahkan alat baru.";
            toast.error(errorMessage);
            console.error("Error adding tool: ", error);
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
                                    <motion.div onClick={() => setIsFormVisible(true)} className="bg-slate-50 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-slate-300 text-slate-500 hover:border-blue-500 hover:text-blue-500 cursor-pointer transition-all duration-300 min-h-[180px]" whilehover={{ scale: 1.03 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
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
                            {/* Tambahkan logika untuk jenis alat 'Dosing' di sini jika perlu */}
                            {/* {selectedAlat && selectedAlat.jenis === 'Dosing' && ( ... )} */}
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