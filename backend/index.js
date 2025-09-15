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

// --- Konfigurasi ---
const MQTT_BROKER_URL = 'mqtt://192.168.1.13';
const FRONTEND_URL = "http://localhost:5173";
const PORT = 5000;
dotenv.config();

const app = express();
const server = http.createServer(app);

// --- PERUBAHAN: Setup Socket.IO ---
const io = new Server(server, {
    cors: {
        origin: FRONTEND_URL,
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
app.use(cors({ credentials: true, origin: FRONTEND_URL }));
app.use(cookieParser());
app.use(express.json());
app.use(router);

// --- LOGIKA MQTT (Hanya untuk Notifikasi Jadwal) ---
const mqttClient = mqtt.connect(MQTT_BROKER_URL);
setMqttClient(mqttClient); // Hubungkan ke notifier

// --- PERUBAHAN: Jalankan Manajer Real-time ---
initializeRealtimeManager(io, mqttClient);

mqttClient.on('connect', () => {
    console.log('✅ Terhubung ke MQTT Broker');
});

mqttClient.on('error', (err) => console.error('❌ Error MQTT:', err));
mqttClient.on('reconnect', () => console.log('🔄 Mencoba rekoneksi MQTT...'));

// Kita tidak lagi butuh on('message') atau Socket.IO di sini
server.listen(PORT, () => console.log(`🚀 Server berjalan di http://localhost:${PORT}`));