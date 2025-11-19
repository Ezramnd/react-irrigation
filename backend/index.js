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
import { setMqttClient, subscribeToDeviceStatus } from './mqttNotifier.js';
import { initializeRealtimeManager } from './realtimeManager.js';
import { handleSyncRequest } from "./controllers/ScheduleController.js";

// --- Konfigurasi ---
const MQTT_BROKER_URL = 'mqtt://192.168.1.13';
const FRONTEND_URL = "http://192.168.1.13:5173";
const PORT = 5000;
dotenv.config();

const app = express();
const server = http.createServer(app);

// --- PERUBAHAN: Setup Socket.IO ---
// --- PERUBAHAN: Setup Socket.IO ---
const io = new Server(server, {
    cors: {
        origin: [
            process.env.FRONTEND_URL, 
            "http://192.168.1.13:5173",
            "http://localhost:5173" // <-- TAMBAHKAN INI
        ],
        methods: ["GET", "POST"]
    }
});

// --- Relasi Model ---
Users.hasMany(Devices, { foreignKey: 'userId' });
Devices.belongsTo(Users, { foreignKey: 'userId' });
Users.hasMany(Schedules, { foreignKey: 'userId' });
Schedules.belongsTo(Users, { foreignKey: 'userId' });
Devices.belongsToMany(Schedules, { through: 'device_schedules', foreignKey: 'deviceId' });
Schedules.belongsToMany(Devices, { through: 'device_schedules', foreignKey: 'scheduleId' });

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
        FRONTEND_URL, "http://192.168.1.13:5173" , "http://localhost:5173"
        // Tambahkan origin ini
    ]
})); 
// Ganti 192.168.1.10 dengan IP lokal komputer Anda. 
// Port 8081 adalah default Expo.
// Atau cara paling mudah untuk development:
// app.use(cors({ credentials: true, origin: '*' })); // Kurang aman untuk produksi
app.use(cookieParser());
app.use(express.json());
app.use(router);

// --- LOGIKA MQTT (Hanya untuk Notifikasi Jadwal) ---
const mqttClient = mqtt.connect(MQTT_BROKER_URL);
setMqttClient(mqttClient); // Hubungkan ke notifier

// --- PERUBAHAN: Jalankan Manajer Real-time ---
initializeRealtimeManager(io, mqttClient);

// Pola regex untuk mencocokkan topik permintaan sinkronisasi
const syncRequestTopicPattern = /^esp32\/alat\/([0-9A-Fa-f:-]+)\/jadwal\/get$/;

mqttClient.on('connect', () => {
    // Berlangganan ke topik permintaan sinkronisasi dari SEMUA perangkat
    const syncTopic = 'esp32/alat/+/jadwal/get';
    mqttClient.subscribe(syncTopic, (err) => {
        if (!err) {
            console.log(`✅ Berhasil subscribe ke topik sinkronisasi: ${syncTopic}`);
        } else {
            console.error(`❌ Gagal subscribe ke ${syncTopic}:`, err);
        }
    });
});

mqttClient.on('message', (topic, message) => {
    // Pesan dari ESP32 biasanya berupa buffer, ubah ke string
    const topicStr = topic.toString();
    console.log(`Pesan diterima di topik: ${topicStr}`);

    // Cek apakah topik yang masuk cocok dengan pola topik sinkronisasi
    const match = topicStr.match(syncRequestTopicPattern);
    if (match) {
        // Ambil MAC address dari topik (grup ke-1 dari regex), lalu ganti '-' menjadi ':'
        const macAddress = match[1].replace(/-/g, ':');
        
        // Panggil fungsi handler yang ada di controller Anda
        handleSyncRequest(macAddress);
        return; // Hentikan proses jika topik sudah ditangani
    }

    // Anda bisa menambahkan logika di sini untuk menangani topik lain,
    // misalnya untuk 'esp32/status/...' yang sudah ada di notifier Anda
});


mqttClient.on('error', (err) => console.error('❌ Error MQTT:', err));
mqttClient.on('reconnect', () => console.log('🔄 Mencoba rekoneksi MQTT...'));

// Kita tidak lagi butuh on('message') atau Socket.IO di sini
server.listen(PORT, () => console.log(`🚀 Server berjalan di http://192.168.1.13:${PORT}`));

