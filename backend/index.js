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

// --- Konfigurasi ---
const MQTT_BROKER_URL = 'mqtt://localhost:1883';
const MQTT_TOPIC_SENSOR = 'esp32/sensor/suhu';
const MQTT_TOPIC_PERINTAH = 'esp32/perintah/led';
const FRONTEND_URL = "http://localhost:5173";
const PORT = 5000;


dotenv.config();
const app = express();

// --- PERUBAHAN UTAMA 1: Buat server HTTP dari app Express ---
const server = http.createServer(app);

// --- PERUBAHAN UTAMA 2: Inisialisasi Socket.IO di atas server HTTP ---
const io = new Server(server, {
    cors: {
        origin: FRONTEND_URL,
        methods: ["GET", "POST"]
    }
});


try {
    await db.authenticate();
    console.log('Database Connected...');
    await Users.sync();
} catch (error) {
    console.error(error);
}

app.use(cors({ credentials:true, origin:'http://localhost:5173' }));
app.use(cookieParser());
app.use(express.json());
app.use(router);

// --- Integrasi Logika MQTT & WebSocket ---

// 1. Koneksi ke MQTT Broker
console.log('Menghubungkan ke MQTT Broker...');
const mqttClient = mqtt.connect(MQTT_BROKER_URL);

mqttClient.on('connect', () => {
    console.log('✅ Terhubung ke MQTT Broker');
    mqttClient.subscribe(MQTT_TOPIC_SENSOR, (err) => {
        if (!err) {
            console.log(`✅ Berhasil subscribe ke topik: ${MQTT_TOPIC_SENSOR}`);
        }
    });
});

// 2. Jembatan: Saat ada pesan dari MQTT, teruskan ke WebSocket
mqttClient.on('message', (topic, message) => {
    console.log(`Menerima pesan dari topik ${topic}: ${message.toString()}`);
    if (topic === MQTT_TOPIC_SENSOR) {
        // Kirim ke semua client web yang terhubung
        io.emit('data-sensor', message.toString());
    }
});

mqttClient.on('error', (err) => {
    console.error('❌ Error koneksi MQTT:', err);
    mqttClient.end();
});

// 3. Jembatan: Saat ada pesan dari WebSocket, teruskan ke MQTT
io.on('connection', (socket) => {
    console.log('✅ Client web terhubung via WebSocket:', socket.id);

    socket.on('perintah-led', (data) => {
        console.log(`Menerima perintah dari web: ${data}`);
        // Publikasikan perintah ke ESP32
        mqttClient.publish(MQTT_TOPIC_PERINTAH, data);
    });

    socket.on('disconnect', () => {
        console.log('Client web terputus:', socket.id);
    });
});

// --- PERUBAHAN UTAMA 3: Jalankan server gabungan ---
server.listen(PORT, () => console.log(`🚀 Server berjalan di http://localhost:${PORT}`));

// HAPUS BARIS INI: app.listen(5000, ()=> console.log('Server running at port 5000'));