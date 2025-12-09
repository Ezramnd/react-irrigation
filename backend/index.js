import express from "express";
import http from 'http';
import { Server } from 'socket.io';
import mqtt from 'mqtt';
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { Op } from 'sequelize'; // <-- Pastikan ini diimpor
import db from "./config/Database.js";
import router from "./routes/index.js";
import Users from "./models/UserModel.js";
import Devices from "./models/DeviceModel.js";
import Schedules from "./models/ScheduleModel.js";
import ClimateSchedules from "./models/ClimateScheduleModel.js";
import ClimateData from "./models/ClimateDataModel.js";
import ScheduleLog from "./models/ScheduleLogModel.js";
import { setMqttClient, subscribeToDeviceStatus } from './mqttNotifier.js';
import { initializeRealtimeManager } from './realtimeManager.js';
import { handleSyncRequest } from "./controllers/ScheduleController.js";
import { handleClimateSyncRequest } from "./controllers/ClimateScheduleController.js"; 

dotenv.config();

// --- Konfigurasi ---
const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtts://broker.avisha.id' || 'broker.avisha.id';
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const PORT = process.env.PORT || 5000;

// ----------8DES---------------
const deviceLastSaveTime = {}; // Format: { 'deviceId': timestamp }
const SAVE_INTERVAL_MS = 30000;
// ----------8DES---------------

const app = express();
const server = http.createServer(app);

// --- PERUBAHAN: Setup Socket.IO ---
// --- PERUBAHAN: Setup Socket.IO ---
export const io = new Server(server, {
    cors: {
        origin: [
            FRONTEND_URL
        ],
        methods: ["GET", "POST"]
    }
});

let lastRelay1State = "OFF";
let lastRelay2State = "OFF";

io.on('connection', (socket) => {
console.log('✅ Frontend terhubung via Socket.IO:', socket.id);

// Kirim status tersimpan ke klien yang baru terhubung
console.log(`Mengirim status tersimpan ke ${socket.id}: Kipas1=${lastRelay1State}, Kipas2=${lastRelay2State}`);
socket.emit('update_relay_1', lastRelay1State);
socket.emit('update_relay_2', lastRelay2State);

socket.on('disconnect', () => {
console.log('Frontend terputus:', socket.id);
});
});

// --- Relasi Model ---
Users.hasMany(Devices, { foreignKey: 'userId' });
Devices.belongsTo(Users, { foreignKey: 'userId' });
Users.hasMany(Schedules, { foreignKey: 'userId' });
Schedules.belongsTo(Users, { foreignKey: 'userId' });
Devices.belongsToMany(Schedules, { through: 'device_schedules', foreignKey: 'deviceId' });
Schedules.belongsToMany(Devices, { through: 'device_schedules', foreignKey: 'scheduleId' });
// Relasi User <-> Jadwal Climate
Users.hasMany(ClimateSchedules, { foreignKey: 'userId' });
ClimateSchedules.belongsTo(Users, { foreignKey: 'userId' });
// Relasi Many-to-Many: Device <-> Jadwal Climate
Devices.belongsToMany(ClimateSchedules, { 
through: 'device_climate_schedules', 
foreignKey: 'deviceId',
as: 'climateSchedules' 
});
ClimateSchedules.belongsToMany(Devices, { 
through: 'device_climate_schedules', 
foreignKey: 'scheduleId',
as: 'devices' 
});

// Relasi Device <-> ClimateData (One-to-Many)
Devices.hasMany(ClimateData, { 
foreignKey: 'deviceId',
onDelete: 'CASCADE' 
});
ClimateData.belongsTo(Devices, { foreignKey: 'deviceId' });

// --- Database & Middleware ---
try {
    await db.authenticate();
    console.log('✅ Database Connected');
    await db.sync();
} catch (error) { console.error('❌ Database Error:', error); }
// Izinkan semua origin, atau tentukan array origin

// ✅ AKTIFKAN DAN KONFIGURASI CORS DI SINI
app.use(cors({
    credentials: true,
    origin: [
        FRONTEND_URL, "http://localhost:5173", "http://192.168.1.23:8081", "http://localhost:8081", "http://localhost:5000"
        // Tambahkan origin ini
    ]
})); 

// ✅ AKTIFKAN DAN KONFIGURASI CORS DI SINI
// app.use(cors({ credentials: true, origin: [FRONTEND_URL, 'http://192.168.1.18:8081'] }));
// // Ganti 192.168.1.10 dengan IP lokal komputer Anda. 
// Port 8081 adalah default Expo.
// Atau cara paling mudah untuk development:
// app.use(cors({ credentials: true, origin: '*' })); // Kurang aman untuk produksi
app.use(cookieParser());
app.use(express.json());
app.use(router);

// --- LOGIKA MQTT (Hanya untuk Notifikasi Jadwal) ---
// 1. Siapkan objek opsi untuk koneksi MQTT
const mqttOptions = {
    username: process.env.MQTT_user,
    password: process.env.MQTT_pass,
    rejectUnauthorized: false
};

// Cek di konsol apakah variabel terbaca (opsional, bagus untuk debugging)
console.log(`🔌 Mencoba koneksi ke MQTT broker dengan user: ${mqttOptions.username}`);

// 2. Gunakan opsi tersebut saat menghubungkan client
const mqttClient = mqtt.connect(MQTT_BROKER_URL, mqttOptions);

setMqttClient(mqttClient); // Hubungkan ke notifier

// --- PERUBAHAN: Jalankan Manajer Real-time ---
initializeRealtimeManager(io, mqttClient);

// Pola regex untuk mencocokkan topik permintaan sinkronisasi
const syncRequestTopicPattern = new RegExp(`^${mqttOptions.username}\\/esp32\\/alat\\/([\\w-]+)\\/jadwal\\/get$`);
const logTopicPattern = new RegExp(`^${mqttOptions.username}\\/esp32\\/alat\\/([\\w-]+)\\/log\\/jadwal$`);
//climate
const climateSyncRequestTopicPattern = new RegExp(`^${mqttOptions.username}\\/climate\\/esp32\\/alat\\/([0-9A-Fa-f:-]+)\\/climate-jadwal\\/get$`); 

mqttClient.on('connect', () => {
    // Topik BARU dengan dua wildcard: satu untuk jenis, satu untuk mac
    const syncTopic = `${mqttOptions.username}/esp32/+/+/jadwal/get`;
    mqttClient.subscribe(syncTopic, (err) => {
        if (!err) {
            console.log(`✅ Berhasil subscribe ke topik sinkronisasi BARU: ${syncTopic}`);
        } else {
            console.error(`❌ Gagal subscribe ke ${syncTopic}:`, err);
        }
    });
    const scheduleLogTopic = `${mqttOptions.username}/esp32/alat/+/log/jadwal`;
    mqttClient.subscribe(scheduleLogTopic, (err) => {
        if (!err) {
            console.log(`✅ Berhasil subscribe ke topik log jadwal: ${scheduleLogTopic}`);
        } else {
            console.error(`❌ Gagal subscribe ke ${scheduleLogTopic}:`, err);
        }
    });

    const climateSyncTopic = `${mqttOptions.username}/climate/esp32/alat/+/climate-jadwal/get`;
    mqttClient.subscribe(climateSyncTopic, (err) => {
        if (!err) {
            console.log(`✅ Berhasil subscribe ke topik sinkronisasi climate: ${climateSyncTopic}`);
        } else {
            console.error(`❌ Gagal subscribe ke ${climateSyncTopic}:`, err);
        }
    });

    const dataTopic = `${mqttOptions.username}/climate/esp32/alat/+/data`;
    mqttClient.subscribe(dataTopic, (err) => {
        if (!err) {
            console.log(`✅ Berhasil subscribe ke topik data sensor BARU: ${dataTopic}`);
        } else {
                console.error(`❌ Gagal subscribe ke ${dataTopic}:`, err);
        }
    });

    const statusTopic = `${mqttOptions.username}/climate/esp32/alat/+/status`;
    mqttClient.subscribe(statusTopic, (err) => {
        if (!err) {
            console.log(`✅ Berhasil subscribe ke topik status BARU: ${statusTopic}`);
        } else {
                console.error(`❌ Gagal subscribe ke ${statusTopic}:`, err);
        }
    });
});

mqttClient.on('message', async (topic, message) => {
    const topicStr = topic.toString();
    console.log(`Pesan diterima di topik: ${topicStr}`);

    const match = topicStr.match(syncRequestTopicPattern);
    
    if (match) {
        // match[1] sekarang berisi "IRRIGATION-4CC3820BE7D8"
        const combinedId = match[1]; 
        
        // Pisahkan deviceType dan simpleMacAddress berdasarkan tanda hubung pertama
        const separatorIndex = combinedId.indexOf('-');
        if (separatorIndex === -1) return; // Abaikan jika formatnya aneh

        const deviceType = combinedId.substring(0, separatorIndex);
        const simpleMacAddress = combinedId.substring(separatorIndex + 1);

        // Format MAC Address ke bentuk standar (dengan titik dua)
        const formattedMacAddress = simpleMacAddress.match(/.{1,2}/g).join(':');

        console.log(`Identifikasi Alat: Tipe=${deviceType}, MAC=${formattedMacAddress}`);

        // Panggil fungsi handler sinkronisasi jadwal
        handleSyncRequest(formattedMacAddress);

        return; // Hentikan proses setelah ditangani
    }
    const logMatch = topicStr.match(logTopicPattern);
    if (logMatch) {
        console.log(`Menerima data log dari: ${topicStr}`);
        try {
            // 1. Ekstrak MAC Address
            const combinedId = logMatch[1];
            const separatorIndex = combinedId.indexOf('-');
            if (separatorIndex === -1) return;
            
            const simpleMacAddress = combinedId.substring(separatorIndex + 1);
            const formattedMacAddress = simpleMacAddress.match(/.{1,2}/g).join(':');

            // 2. Cari Perangkat (Device)
            const device = await Devices.findOne({ where: { macAddress: formattedMacAddress } });
            if (!device) {
                console.log(`Log diterima, tapi perangkat ${formattedMacAddress} tidak ditemukan.`);
                return;
            }

            // 3. Parse Payload
            const logData = JSON.parse(message.toString());

            // 4. Buat Log di Database
            await ScheduleLog.create({
                nama: logData.nama,
                tanggal: logData.tanggal,
                waktu: logData.waktu,
                durasi: logData.durasi,
                solenoid: logData.solenoid,
                internet: logData.internet,
                status: logData.status,
                // Ubah Unix timestamp (detik) dari ESP32 ke JavaScript Date object (milidetik)
                timestamp: new Date(logData.timestamp * 1000), 
                userId: device.userId,
                deviceId: device.id
            });
            console.log(`✅ Log jadwal untuk perangkat ${device.nama} berhasil disimpan.`);

        } catch (e) {
            console.error("Gagal memproses pesan log:", e);
        }
        return;
    }

    //climate
    const climateMatch = topicStr.match(climateSyncRequestTopicPattern);
    if (climateMatch) {
        const macAddress = climateMatch[1].replace(/-/g, ':');
        handleClimateSyncRequest(macAddress);
            return;
    }

    if (topicStr.startsWith(`${mqttOptions.username}/climate/esp32/alat/`) && topicStr.endsWith("/status")) {
            try {
                const data = JSON.parse(messageStr);
                if (data.kipas1) {
                    lastRelay1State = data.kipas1; // "ON" or "OFF"
                    io.emit('update_relay_1', lastRelay1State);
                    console.log(`[Status] Kipas 1 diupdate ke: ${lastRelay1State}`);
                }
                if (data.kipas2) {
                    lastRelay2State = data.kipas2; // "ON" or "OFF"
                    io.emit('update_relay_2', lastRelay2State);
                    console.log(`[Status] Kipas 2 diupdate ke: ${lastRelay2State}`);
                }
            } catch (error) {
                console.error(`Gagal memproses status from ${topicStr}:`, error.message);
            }
            return; // Selesai
        }

    if (topicStr.startsWith(`${mqttOptions.username}/climate/esp32/alat/`) && topicStr.endsWith("/data")) {
        try {
            const macAddressWithHyphen = topicStr.split('/')[4]; 
            const macAddress = macAddressWithHyphen.replace(/-/g, ':');

            // console.log(`[Debug] Mencari device dengan MAC (format colon): ${macAddress}`);

            const device = await Devices.findOne({ where: { macAddress: macAddress } });
            if (!device) {
                console.warn(`Data sensor diterima dari MAC ${macAddress} yang tidak terdaftar.`);
                return;
            }

            const messageStr = message.toString();

            const data = JSON.parse(messageStr);
            
            const lastLog = await ClimateData.findOne({
                where: { deviceId: device.id },
                order: [['createdAt', 'DESC']], // Ambil yang paling baru
            });

            // Tentukan status default berdasarkan database terakhir
            let finalKipas1 = lastLog ? lastLog.kipas1_status : "OFF";
            let finalKipas2 = lastLog ? lastLog.kipas2_status : "OFF";

            if (data.kipas1) finalKipas1 = data.kipas1;
            if (data.kipas2) finalKipas2 = data.kipas2;

            // --------------8DES---------------------
            lastRelay1State = finalKipas1;
            lastRelay2State = finalKipas2;

            io.emit('update_relay_1', finalKipas1);
            io.emit('update_relay_2', finalKipas2);
            io.emit('update_suhu', data.suhu);
            io.emit('update_kelembaban', data.kelembaban);

            const currentTime = Date.now();
            const lastSave = deviceLastSaveTime[device.id] || 0;

            if (currentTime - lastSave >= SAVE_INTERVAL_MS) {
                const newClimateEntry = await ClimateData.create({
                    suhu: data.suhu,
                    kelembaban: data.kelembaban,
                    kipas1_status: finalKipas1, 
                    kipas2_status: finalKipas2, 
                    deviceId: device.id 
                });
                
                deviceLastSaveTime[device.id] = currentTime;
                
                io.emit('new_historical_data');
                io.emit('new_climate_data', newClimateEntry);

            console.log(`💾 [DATABASE] Data tersimpan untuk ${device.nama} (Interval > 30s).`);
            } else {
                console.log(`⏩ [SKIP DB] Data diterima tapi belum 30s (${device.nama}). Socket.IO tetap update.`);
            }
        } catch (error) {
            console.error(`Gagal memproses/menyimpan data sensor dari ${topicStr}:`, error.message);
        }
        return; 
        }
});
// ---------------8DES-----------------------

mqttClient.on('error', (err) => console.error('❌ Error MQTT:', err));
mqttClient.on('reconnect', () => console.log('🔄 Mencoba rekoneksi MQTT...'));

server.listen(PORT, () => console.log(`🚀 Server berjalan di ${process.env.APP_URL}:${PORT}`));

