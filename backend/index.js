import express from "express";
import http from 'http';
import { Server } from 'socket.io';
import mqtt from 'mqtt';
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors"
import db from "./config/Database.js";
import router from "./routes/index.js";
import Users from "./models/UserModel.js";
import Devices from "./models/DeviceModel.js";
import Schedules from "./models/ScheduleModel.js";

// --- Konfigurasi yang Diperbaiki ---
const MQTT_BROKER_URL = 'mqtt://localhost'; 
const MQTT_TOPIC_SENSOR = 'esp32/sensor/suhu';
const MQTT_TOPIC_PERINTAH = 'esp32/led/control';
const MQTT_TOPIC_STATUS = 'esp32/status'; // Topik baru untuk status LWT
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

function connectMQTT() {
    console.log('🔄 Menghubungkan ke MQTT Broker...');
    mqttClient = mqtt.connect(MQTT_BROKER_URL, mqttOptions);
    
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
    });

    mqttClient.on('message', (topic, message) => {
        const messageStr = message.toString();
        console.log(`📩 Menerima pesan dari topik ${topic}: ${messageStr}`);
        
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

// --- Socket.IO Logic ---
io.on('connection', (socket) => {
    console.log('✅ Client web terhubung via WebSocket:', socket.id);
    
    // Kirim status koneksi MQTT saat client terhubung
    socket.emit('mqtt-status', { connected: mqttConnected });

    // Handler untuk perintah LED dari client web
    socket.on('perintah-led', (data) => {
        console.log(`📤 Menerima perintah dari web:`, data);
        
        const validCommands = ['ON', 'OFF', 'MODE1', 'MODE2'];
        if (!validCommands.includes(data)) {
            console.error('❌ Perintah tidak valid:', data);
            socket.emit('error', { message: 'Perintah tidak valid' });
            return;
        }
        
        if (mqttConnected) {
            mqttClient.publish(MQTT_TOPIC_PERINTAH, data, { qos: 1 }, (err) => {
                if (err) {
                    console.error('❌ Gagal mengirim perintah:', err);
                    socket.emit('command-status', { 
                        success: false, 
                        message: 'Gagal mengirim perintah ke ESP32' 
                    });
                } else {
                    console.log('✅ Perintah berhasil dikirim ke MQTT');
                    socket.emit('command-status', { 
                        success: true, 
                        command: data,
                        timestamp: new Date().toISOString()
                    });
                }
            });
        } else {
            console.error('❌ MQTT tidak terhubung, tidak dapat mengirim perintah');
            socket.emit('command-status', { 
                success: false, 
                message: 'Server tidak terhubung ke MQTT Broker' 
            });
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