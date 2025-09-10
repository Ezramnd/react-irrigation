import express from "express";
import http from 'http';
import { Server } from 'socket.io';
import mqtt from 'mqtt';
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import db from "./config/Database.js";
import router from "./routes/index.js";
import Users from "./models/UserModel.js";
import Devices from "./models/DeviceModel.js";
import Schedules from "./models/ScheduleModel.js";
import { setMqttClient } from './mqttNotifier.js';
import cron from 'node-cron';
import { Op } from 'sequelize';

// --- Konfigurasi yang Diperbaiki ---
const MQTT_BROKER_URL = 'mqtt://localhost'; 
const MQTT_TOPIC_SENSOR = 'esp32/sensor/suhu';
const MQTT_TOPIC_PERINTAH = 'esp32/led/control';
const MQTT_TOPIC_TIME = 'esp32/waktu';
const MQTT_TOPIC_JADWAL = 'esp32/jadwal/set';
const MQTT_TOPIC_STATUS = 'esp32/status'; // Topik baru untuk status LWT
const MQTT_TOPIC_INFO = 'esp32/info';
const FRONTEND_URL = "http://localhost:5173";
const PORT = 5000;

// MQTT connection options
const mqttOptions = {
    clientId: `server_${Math.random().toString(16).slice(2, 8)}`,
    clean: true,
    connectTimeout: 4000,
    reconnectPeriod: 1000,
};

dotenv.config();
const app = express();
const server = http.createServer(app);

// --- DEFINISI RELASI ---
// Relasi yang sudah ada
Users.hasMany(Devices, { foreignKey: 'userId' });
Devices.belongsTo(Users, { foreignKey: 'userId' });

// Relasi baru untuk Jadwal
Users.hasMany(Schedules, { foreignKey: 'userId' });
Schedules.belongsTo(Users, { foreignKey: 'userId' });

// Relasi Many-to-Many antara Devices dan Schedules
Devices.belongsToMany(Schedules, { through: 'device_schedules', foreignKey: 'deviceId' });
Schedules.belongsToMany(Devices, { through: 'device_schedules', foreignKey: 'scheduleId' });
// --------------------

// Socket.IO setup
const io = new Server(server, {
    cors: {
        origin: FRONTEND_URL,
        methods: ["GET", "POST"]
    }
});

// Database connection
try {
    await db.authenticate();
    console.log('✅ Database Connected');
    await db.sync();
} catch (error) {
    console.error('❌ Database Error:', error);
}

// Middleware
app.use(cors({ credentials: true, origin: FRONTEND_URL }));
app.use(cookieParser());
app.use(express.json());
app.use(router);

// --- Fungsi Pembantu untuk MQTT ---
let mqttConnected = false;
// --- LOGIKA UTAMA MQTT & SOCKET.IO ---
let mqttClient;

async function connectMQTT() {
    console.log('🔄 Menghubungkan ke MQTT Broker...');
    mqttClient = mqtt.connect(MQTT_BROKER_URL);
    setMqttClient(mqttClient);
    
    mqttClient.on('connect', async () => {
        console.log('✅ Terhubung ke MQTT Broker');
        
        // Subscribe ke topik perkenalan umum
        mqttClient.subscribe('esp32/perkenalan', (err) => {
            if (!err) console.log(`✅ Berhasil subscribe ke topik perkenalan`);
        });

        // Ambil semua alat yang sudah terdaftar & punya MAC
        const registeredDevices = await Devices.findAll({ where: { macAddress: { [Op.ne]: null } } });
        console.log(`Menyiapkan listener untuk ${registeredDevices.length} perangkat terdaftar...`);

        // Subscribe ke topik status unik untuk setiap alat
        registeredDevices.forEach(device => {
            let macTopic = device.macAddress.replace(/:/g, '-');
            const statusTopic = `esp32/status/${macTopic}`;
            mqttClient.subscribe(statusTopic, (err) => {
                if (!err) console.log(`  -> Berhasil subscribe ke ${statusTopic}`);
            });
        });
    });

    mqttClient.on('message', async (topic, message) => {
        const messageStr = message.toString();
        console.log(`📩 Menerima pesan dari topik ${topic}: ${messageStr}`);
        
        // Cek apakah ini pesan status dari ESP32
        if (topic.startsWith('esp32/status/')) {
            try {
                const macFromTopic = topic.split('/')[2].replace(/-/g, ':');
                const statusData = JSON.parse(messageStr);

                // Update data di database
                await Devices.update(
                    { status: 'active', details: statusData },
                    { where: { macAddress: macFromTopic } }
                );

                // Ambil data lengkap alat untuk dikirim ke frontend
                const updatedDevice = await Devices.findOne({ 
                    where: { macAddress: macFromTopic },
                    include: Users 
                });

                if (updatedDevice) {
                    // Siarkan pembaruan ke semua klien web yang terhubung
                    io.emit('device-update', updatedDevice.toJSON());
                    console.log(`📢 Menyiarkan pembaruan untuk perangkat: ${updatedDevice.nama}`);
                }
            } catch (e) {
                console.error("❌ Gagal memproses pesan status:", e);
            }
        }
    });
}

connectMQTT();
// API endpoint untuk cek status MQTT
app.get('/api/mqtt-status', (req, res) => {
    res.json({ 
        connected: mqttConnected,
        broker: MQTT_BROKER_URL
    });
});

// Start server
server.listen(PORT, () => console.log(`🚀 Server berjalan di http://localhost:${PORT}`));