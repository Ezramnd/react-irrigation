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
let mqttClient;

// --- State In-Memory untuk Data Real-time ESP32 ---
let esp32DeviceData = {
    id: 'ESP32Client-RuangKontrol', // Sesuaikan dengan ClientID di ESP32 Anda
    namaEsp: 'ESP32 Ruang Kontrol',
    lokasi: 'Gudang Utama',
    status: 'inactive', // 'inactive' atau 'active'
    detail: {
        ipAddress: 'N/A',
        chipId: 'N/A',
        firmware: 'N/A',
        mqtt: {
            status: 'disconnected',
            broker: MQTT_BROKER_URL
        },
        wifi: { ssid: 'N/A' },
        history: []
    }
};

function connectMQTT() {
    console.log('🔄 Menghubungkan ke MQTT Broker...');
    mqttClient = mqtt.connect(MQTT_BROKER_URL, mqttOptions);
    setMqttClient(mqttClient);
    
    mqttClient.on('connect', () => {
        mqttConnected = true;
        console.log('✅ Terhubung ke MQTT Broker');
        
        // Berlangganan ke topik sensor DAN topik status
        mqttClient.subscribe([MQTT_TOPIC_SENSOR, MQTT_TOPIC_STATUS], (err) => {
            if (!err) {
                console.log(`✅ Berhasil subscribe ke topik: ${MQTT_TOPIC_SENSOR} & ${MQTT_TOPIC_STATUS}`);
            } else {
                console.error('❌ Gagal subscribe:', err);
            }
        });
    });

    mqttClient.on('reconnect', () => {
        console.log('🔄 Mencoba menghubungkan ulang ke MQTT Broker...');
    });

    mqttClient.on('error', (err) => {
        mqttConnected = false;
        console.error('❌ Error koneksi MQTT:', err);
        esp32DeviceData.detail.mqtt.status = 'disconnected';
        io.emit('device-update', esp32DeviceData);
    });

    mqttClient.on('message', (topic, message) => {
        const messageStr = message.toString();
        console.log(`📩 Menerima pesan dari topik ${topic}: ${messageStr}`);
         const logEntry = { timestamp: new Date().toLocaleTimeString('id-ID'), message: `[${topic.split('/').pop()}] ${messageStr}` };
        esp32DeviceData.detail.history.unshift(logEntry);
        if (esp32DeviceData.detail.history.length > 20) esp32DeviceData.detail.history.pop();
        if (topic === MQTT_TOPIC_STATUS) {
            esp32DeviceData.status = messageStr === 'online' ? 'active' : 'inactive';
        } else if (topic === MQTT_TOPIC_INFO) {
            try {
                const info = JSON.parse(messageStr);
                esp32DeviceData.detail.ipAddress = info.ipAddress;
                esp32DeviceData.detail.chipId = info.chipId;
                esp32DeviceData.detail.firmware = info.firmware;
                esp32DeviceData.detail.wifi.ssid = info.ssid;
            } catch (e) {
                console.error("Gagal parse JSON dari topik info:", e);
            }
        }
        io.emit('device-update', esp32DeviceData);

        if (topic === MQTT_TOPIC_SENSOR) {
            try {
                const data = JSON.parse(messageStr);
                io.emit('data-sensor', data);
            } catch{
                io.emit('data-sensor', messageStr);
            }
        } 
        // Logika baru untuk menangani pesan status dari ESP32
        else if (topic === MQTT_TOPIC_STATUS) {
            io.emit('esp-status', { status: messageStr });
            console.log(`✅ Mengirim status ESP32 ke klien web: ${messageStr}`);
        }
    });

    mqttClient.on('offline', () => {
        mqttConnected = false;
        console.log('❌ MQTT Broker offline');
    });
}

// Inisialisasi koneksi MQTT
connectMQTT();

// --- Logika Socket.IO ---
io.on('connection', (socket) => {
    console.log('✅ Client web terhubung via WebSocket:', socket.id);

    socket.emit('device-update', esp32DeviceData);

    socket.on('perintah-led', (command) => {
        console.log(`📤 Menerima perintah dari web:`, command);
        if (mqttClient && mqttClient.connected) {
            mqttClient.publish(TOPICS.CONTROL, command);

            const logEntry = { timestamp: new Date().toLocaleTimeString('id-ID'), message: `CMD: ${command}` };
            esp32DeviceData.detail.history.unshift(logEntry);
            io.emit('device-update', esp32DeviceData);
        } else {
            console.error('❌ MQTT tidak terhubung, perintah gagal dikirim.');
        }
    });

    socket.on('disconnect', () => {
        console.log('❌ Client web terputus:', socket.id);
    });
});

// API endpoint untuk cek status MQTT
app.get('/api/mqtt-status', (req, res) => {
    res.json({ 
        connected: mqttConnected,
        broker: MQTT_BROKER_URL
    });
});

// Start server
server.listen(PORT, () => console.log(`🚀 Server berjalan di http://localhost:${PORT}`));