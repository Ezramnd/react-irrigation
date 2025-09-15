import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { motion } from 'framer-motion';

const QrScanner = ({ onScan, onClose }) => {
  const scannerRef = useRef(null);
  // [BARU] Gunakan ref untuk menyimpan instance scanner agar bisa diakses di cleanup function
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    if (!scannerRef.current) return;

    // Buat instance baru dan simpan di ref
    html5QrCodeRef.current = new Html5Qrcode(scannerRef.current.id);
    const html5QrCode = html5QrCodeRef.current;

    const qrCodeSuccessCallback = (decodedText, decodedResult) => {
      onScan(decodedText);
    };

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    // [UBAH] Logika untuk memilih kamera secara dinamis
    const startScanner = async () => {
      try {
        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length) {
          // Pilih kamera belakang jika ada, jika tidak, gunakan kamera pertama
          const cameraId = cameras.find(camera => camera.label.toLowerCase().includes('back'))?.id || cameras[0].id;
          
          await html5QrCode.start(
            cameraId,
            config,
            qrCodeSuccessCallback
          );
        } else {
            console.error("Tidak ada kamera yang ditemukan.");
        }
      } catch (err) {
        console.error("Gagal memulai scanner:", err);
      }
    };

    startScanner();

    // Cleanup function
    return () => {
      // Hentikan scanner jika sedang berjalan saat komponen unmount
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(err => console.error("Gagal menghentikan scanner saat unmount.", err));
      }
    };
  }, [onScan]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center z-[70] p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: -20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: -20 }}
        className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-center text-gray-800 mb-4">Arahkan ke QR Code</h3>
        
        <div 
          id="qr-reader" 
          ref={scannerRef} 
          className="
            w-full aspect-square rounded-lg overflow-hidden border bg-slate-100 
            [&>video]:w-full [&>video]:h-full [&>video]:object-cover
          "
        ></div>
        
        <button
          onClick={onClose}
          className="w-full mt-4 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-colors"
        >
          Batal
        </button>
      </motion.div>
    </motion.div>
  );
};

export default QrScanner;