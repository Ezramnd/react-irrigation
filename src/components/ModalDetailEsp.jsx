import React from 'react';
import { motion } from 'framer-motion';

// Komponen kecil untuk baris informasi (Key-Value Pair)
const InfoRow = ({ label, value, children }) => (
  <div className="flex justify-between items-center py-3 border-b border-gray-200 last:border-b-0">
    <span className="text-sm text-gray-600">{label}</span>
    {children ? children : <span className="text-sm font-semibold text-gray-800 break-all">{value}</span>}
  </div>
);

// Komponen utama Modal yang sudah diperbarui dengan tombol kontrol
const ModalDetailEsp = ({ esp, onClose, onEditWifi, onCommand }) => { // Tambahan prop: onCommand
  const details = esp?.detail || {};
  const mqttDetails = details.mqtt || {};
  const wifiDetails = details.wifi || {};
  const history = details.history || [];

  const connectionStatus = { active: { text: 'Online', textColor: 'text-green-600', bgColor: 'bg-green-100' }, inactive: { text: 'Offline', textColor: 'text-red-600', bgColor: 'bg-red-100' } };
  const currentConnectionStatus = connectionStatus[esp.status] || { text: 'Unknown', textColor: 'text-gray-600', bgColor: 'bg-gray-100' };

  const mqttStatus = { connected: { text: 'Connected', textColor: 'text-blue-600', bgColor: 'bg-blue-100' }, disconnected: { text: 'Disconnected', textColor: 'text-orange-600', bgColor: 'bg-orange-100' } };
  const currentMqttStatus = mqttStatus[mqttDetails.status] || { text: 'Unknown', textColor: 'text-gray-600', bgColor: 'bg-gray-100' };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div layoutId={`card-container-${esp.id}`} className="bg-gray-50 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* --- Header Modal --- */}
        <div className="flex-shrink-0 flex justify-between items-center border-b border-gray-200 p-5 bg-white">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Detail Perangkat: {esp.namaEsp}</h2>
            <p className="text-sm text-gray-500">{esp.lokasi}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* --- Konten Scrollable --- */}
        <div className="flex-grow p-6 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              {/* --- BAGIAN BARU: KONTROL LANGSUNG --- */}
              <div className="bg-white p-5 rounded-xl shadow-md">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Kontrol Langsung (LED)</h3>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => onCommand('ON')} className="w-full py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600">ON</button>
                    <button onClick={() => onCommand('OFF')} className="w-full py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600">OFF</button>
                    <button onClick={() => onCommand('MODE1')} className="w-full py-2 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600">Mode 1 (Cepat)</button>
                    <button onClick={() => onCommand('MODE2')} className="w-full py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600">Mode 2 (Lambat)</button>
                </div>
              </div>
              
              {/* Card Informasi Perangkat */}
              <div className="bg-white p-5 rounded-xl shadow-md">
                <h3 className="text-lg font-bold text-gray-800 mb-3">Informasi Perangkat</h3>
                <InfoRow label="Status Koneksi"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${currentConnectionStatus.textColor} ${currentConnectionStatus.bgColor}`}>{currentConnectionStatus.text}</span></InfoRow>
                <InfoRow label="Alamat IP" value={details.ipAddress || 'N/A'} />
                <InfoRow label="Chip ID" value={details.chipId || 'N/A'} />
                <InfoRow label="Versi Firmware" value={details.firmware || 'N/A'} />
              </div>

              {/* Card Status MQTT & WiFi digabung */}
              <div className="bg-white p-5 rounded-xl shadow-md">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-bold text-gray-800">Konektivitas</h3>
                  <button onClick={onEditWifi} className="text-sm bg-blue-100 text-blue-700 font-semibold px-3 py-1 rounded-md hover:bg-blue-200">Edit WiFi</button>
                </div>
                <InfoRow label="Status MQTT"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${currentMqttStatus.textColor} ${currentMqttStatus.bgColor}`}>{currentMqttStatus.text}</span></InfoRow>
                <InfoRow label="Broker MQTT" value={details.mqtt?.broker || 'N/A'} />
                <InfoRow label="SSID WiFi" value={details.wifi?.ssid || 'N/A'} />
              </div>
            </div>

            {/* Kolom Riwayat Kontrol */}
            <div className="bg-white p-5 rounded-xl shadow-md flex flex-col">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Riwayat Kontrol (Log)</h3>
              <div className="bg-gray-800 text-white font-mono text-xs rounded-lg p-4 flex-grow h-64 overflow-y-auto">
                {history.length > 0 ? (
                  history.map((log, index) => (
                    <p key={index} className="whitespace-pre-wrap">
                      <span className="text-gray-400">{log.timestamp}: </span>
                      <span className="text-green-300">{log.message}</span>
                    </p>
                  ))
                ) : (<p className="text-gray-400">Menunggu log dari perangkat...</p>)}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ModalDetailEsp;