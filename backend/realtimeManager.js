import Devices from './models/DeviceModel.js';
import dotenv from "dotenv";
dotenv.config();

// Regex untuk menangkap ID alat dari topik: username/esp32/alat/ID_ALAT/info
const createInfoTopicPattern = (username) => new RegExp(`^${username}\\/esp32\\/alat\\/([\\w-]+)\\/info$`);

const createStatusTopicPattern = (username) => new RegExp(`^${username}\\/esp32\\/alat\\/([\\w-]+)\\/status$`);

const TOPICS = {
    CONTROL: 'esp32/led/control',
    INFO: 'esp32/info'
};

// Fungsi Helper untuk membersihkan MAC Address
const getCleanMac = (combinedId) => {
    // Jika format "IRRIGATION-EC62...", ambil bagian belakangnya saja
    let simpleMac = combinedId.includes('-') ? combinedId.split('-')[1] : combinedId;
    
    // Format menjadi AA:BB:CC... agar cocok dengan database
    if (simpleMac.length === 12) {
        return simpleMac.match(/.{1,2}/g).join(':');
    }
    return simpleMac;
};

// Variabel data dummy (disimpan sesuai permintaan, meski belum terpakai di logika inti)
let esp32DeviceData = {
    id: 'IRRIGATION-DEFAULT', 
    namaEsp: 'ESP32 Default',
    lokasi: 'Gudang',
    detail: {
        ipAddress: 'N/A',
        chipId: 'N/A',
        firmware: 'N/A',
        mqtt: { status: 'disconnected', broker: '' },
        wifi: { ssid: 'N/A' },
        history: []
    }
};

export function initializeRealtimeManager(io, mqttClient) {
    const username = process.env.MQTT_USER || 'default_user'; // Pastikan env variable namanya sesuai (MQTT_USER vs MQTT_user)
    
  // Buat Pola Regex
    const infoTopicPattern = createInfoTopicPattern(username);
    const statusTopicPattern = createStatusTopicPattern(username);
    // Topik Subscription
    const subInfo = `${username}/esp32/alat/+/info`;
    const subStatus = `${username}/esp32/alat/+/status`; // <--- INI YANG KEMARIN KURANG

   // --- A. LOGIKA KONEKSI ---
    mqttClient.on('connect', () => {
        console.log('✅ Realtime Manager: Terhubung ke MQTT Broker');
        
        // Subscribe ke KEDUA topik (Info & Status)
        mqttClient.subscribe([subInfo, subStatus], (err) => {
            if (!err) {
                console.log(`📡 Listening Info pada:   ${subInfo}`);
                console.log(`📡 Listening Status pada: ${subStatus}`);
            } else {
                console.error("❌ Gagal subscribe:", err);
            }
        });
    });

    mqttClient.on('message', async (topic, message) => {
        const topicStr = topic.toString();
        const messageStr = message.toString();

        const matchInfo = topicStr.match(infoTopicPattern);
        
        if (matchInfo) {
            const formattedMac = getCleanMac(matchInfo[1]);
            
            try {
                const infoData = JSON.parse(messageStr);

                // Update DB
                await Devices.update(
                    { 
                        ipAddress: infoData.ipAddress,
                        ssid: infoData.ssid,
                        firmware: infoData.firmware || '1.0.0',
                        status: 'active' // Asumsi jika kirim info berarti aktif
                    }, 
                    { where: { macAddress: formattedMac } }
                );

                // Kirim ke Frontend
                io.emit('device_status_update', {
                    macAddress: formattedMac,
                    ipAddress: infoData.ipAddress,
                    ssid: infoData.ssid,
                    firmware: infoData.firmware,
                    status: 'active'
                });
            } catch (error) {
                console.error(`❌ Error info ${formattedMac}:`, error.message);
            }
        }
        const matchStatus = topicStr.match(statusTopicPattern);
        if (matchStatus) {
            const formattedMac = getCleanMac(matchStatus[1]);
            const statusMsg = messageStr.toUpperCase(); // "ONLINE" atau "OFFLINE"

            // Mapping status text ke status database ('active' / 'inactive')
            const dbStatus = (statusMsg === 'ONLINE') ? 'active' : 'inactive';

            // console.log(`🔔 Status Update [${formattedMac}]: ${statusMsg}`);

            try {
                // Update DB Status Saja
                await Devices.update(
                    { status: dbStatus },
                    { where: { macAddress: formattedMac } }
                );

                // Kirim ke Frontend (Agar badge berubah warna)
                io.emit('device_status_update', {
                    macAddress: formattedMac,
                    status: dbStatus // Frontend menerima 'active' atau 'inactive'
                    // (Atau sesuaikan dengan logika frontend jika butuh 'Online')
                });
                
                console.log(`⚡ Device ${formattedMac} is now ${statusMsg}`);

            } catch (error) {
                console.error(`❌ Error status ${formattedMac}:`, error.message);
            }
        }
    });

    // --- B. LOGIKA SOCKET (Opsional / Legacy) ---
    // CATATAN: Bagian ini hanya akan jalan jika Frontend menggunakan 'socket.emit("control_command")'.
    // Karena Frontend Dashboard saat ini menggunakan 'api.post(...)', logika kontrol sesungguhnya
    // sebaiknya ada di Controller (Backend API).
    io.on('connection', (socket) => {
        socket.on('control_command', (payload) => {
            console.log(`⚠️ Socket Command Received (Deprecated via Socket):`, payload);
            
            // Logika publish MQTT dipindahkan ke Controller agar lebih aman via API.
            // Tapi jika Anda ingin mengubah frontend jadi socket only, kode ini bisa dipakai:
            /*
            if (!payload.macAddress) return;
            const macClean = payload.macAddress.replace(/:/g, '');
            const deviceId = `IRRIGATION-${macClean}`;
            const controlTopic = `${username}/esp32/alat/${deviceId}/manual/set`;
            mqttClient.publish(controlTopic, JSON.stringify(payload));
            */
        });
    });
}