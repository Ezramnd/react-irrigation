import express from "express";
import http from 'http';
import { Server } from 'socket.io';
import mqtt from 'mqtt';
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import db from "./config/Database.js";

import Users from "./models/UserModel.js";
import Devices from "./models/DeviceModel.js";
import Schedules from "./models/ScheduleModel.js";
import ClimateSchedules from "./models/ClimateScheduleModel.js";
import ClimateData from "./models/ClimateDataModel.js";
import router from "./routes/index.js";
import { setMqttClient } from './mqttNotifier.js';
import { initializeRealtimeManager } from './realtimeManager.js';
import { handleSyncRequest } from "./controllers/ScheduleController.js";
import { handleClimateSyncRequest } from "./controllers/ClimateScheduleController.js";

// --- IMPORT MODEL DOSING ---
import DosingSettings from "./models/DosingSettingsModel.js";
import DosingData from "./models/DosingDataModel.js";

// ==========================================
// RELASI DATABASE
// ==========================================
Users.hasMany(Devices, { foreignKey: 'userId' });
Devices.belongsTo(Users, { foreignKey: 'userId' });

Users.hasMany(Schedules, { foreignKey: 'userId' });
Schedules.belongsTo(Users, { foreignKey: 'userId' });

Devices.belongsToMany(Schedules, { through: 'device_schedules', foreignKey: 'deviceId' });
Schedules.belongsToMany(Devices, { through: 'device_schedules', foreignKey: 'scheduleId' });

Users.hasMany(ClimateSchedules, { foreignKey: 'userId' });
ClimateSchedules.belongsTo(Users, { foreignKey: 'userId' });

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

Devices.hasMany(ClimateData, { foreignKey: 'deviceId', onDelete: 'CASCADE' });
ClimateData.belongsTo(Devices, { foreignKey: 'deviceId' });

Devices.hasMany(DosingData, { foreignKey: 'deviceId', onDelete: 'CASCADE' });
DosingData.belongsTo(Devices, { foreignKey: 'deviceId' });

// ==========================================
// VARIABLE MEMORI (STATUS TERAKHIR)
// ==========================================

// 1. VARIABLE DOSING (AZIS) - INI YANG KEMARIN ERROR (MISSING)
// Format: { "mac_address": { pumpA: "OFF", pumpB: "OFF", tempSuhu: 0, tempTDS: 0 } }
const dosingStates = {}; 

// 2. VARIABLE CLIMATE (HAFIZH)
let lastRelay1State = "OFF";
let lastRelay2State = "OFF";

// Config
const MQTT_BROKER_URL = 'mqtt://103.127.97.247';
const PORT = 5000;
dotenv.config();

const app = express();
const server = http.createServer(app);

// SETUP SOCKET.IO (CORS ENABLED)
export const io = new Server(server, {
    cors: {
        origin: "*", // Buka semua akses agar HP bisa connect
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log('✅ Frontend terhubung via Socket.IO:', socket.id);

    // Kirim status Climate
    socket.emit('update_relay_1', lastRelay1State);
    socket.emit('update_relay_2', lastRelay2State);

    // Kirim status Dosing jika client request room (Optional but good)
    socket.on('join_room', (macRaw) => {
        if(macRaw) {
            const mac = macRaw.replace(/-/g, ':').toLowerCase();
            if(dosingStates[mac]) {
                socket.emit('update_pompa_a', dosingStates[mac].pumpA);
                socket.emit('update_pompa_b', dosingStates[mac].pumpB);
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('Frontend terputus:', socket.id);
    });
});

// SYNC DATABASE
try {
    await db.authenticate();
    console.log('✅ Database Connected');
    
    // Pastikan tabel dosing ada (hanya create if not exists)
    await DosingData.sync(); 
    await db.sync(); 
    await DosingSettings.sync(); 
    
} catch (error) { 
    console.error('❌ Database Error:', error); 
}

app.use(cors({ credentials: true, origin: true })); // Allow all origins
app.use(cookieParser());
app.use(express.json());
app.use(router);

// MQTT SETUP
const mqttOptions = {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    clientId: 'backend_server_' + Math.random().toString(16).substr(2, 8) 
};

const mqttClient = mqtt.connect(MQTT_BROKER_URL, mqttOptions);

setMqttClient(mqttClient);
initializeRealtimeManager(io, mqttClient);

const syncRequestTopicPattern = /^esp32\/alat\/([0-9A-Fa-f:-]+)\/jadwal\/get$/;
const climateSyncRequestTopicPattern = /^hafizh11\/esp32\/alat\/([0-9A-Fa-f:-]+)\/climate-jadwal\/get$/; 

mqttClient.on('connect', () => {
    console.log('✅ MQTT Terhubung');

    // Subscribe Topik Umum
    mqttClient.subscribe('esp32/alat/+/jadwal/get');
    mqttClient.subscribe('hafizh11/esp32/alat/+/climate-jadwal/get');
    mqttClient.subscribe("hafizh11/esp32/alat/+/data");
    mqttClient.subscribe("hafizh11/esp32/alat/+/status");

    // Subscribe Topik Dosing (Azis)
    const dosingTopic = "azismaulana/esp32/alat/+/dosing/#"; 
    mqttClient.subscribe(dosingTopic, (err) => {
        if (!err) console.log(`✅ Berhasil subscribe ke Dosing System: ${dosingTopic}`);
        else console.error(`❌ Gagal subscribe Dosing:`, err);
    });
});

// ==========================================
// HANDLE PESAN MASUK (MQTT)
// ==========================================
mqttClient.on('message', async (topic, message) => {
    const topicStr = topic.toString();
    const messageStr = message.toString(); 

    // --------------------------------------------------------
    // 1. LOGIKA DOSING SYSTEM (AZIS) - FIXED SPLIT TOPIC
    // --------------------------------------------------------
    if (topicStr.startsWith("azismaulana/esp32/alat/") && topicStr.includes("/dosing/")) {
        
        try {
            // Ambil MAC Address
            const parts = topicStr.split('/');
            const macWithDash = parts[3]; 
            const macAddress = macWithDash.replace(/-/g, ':').toLowerCase();

            // Inisialisasi Memori untuk MAC ini (FIX ERROR UNDEFINED)
            if (!dosingStates[macAddress]) {
                dosingStates[macAddress] = { pumpA: "OFF", pumpB: "OFF", tempSuhu: 0, tempTDS: 0 };
            }

            // A. DATA SUHU (Simpan Sementara)
            if (topicStr.endsWith("/dosing/data/suhu_air")) {
                const suhuVal = parseFloat(messageStr);
                dosingStates[macAddress].tempSuhu = suhuVal;
                
                // console.log(`🌡️ [DOSING] Suhu Masuk: ${suhuVal} (Pending TDS...)`);
                io.emit('update_suhu', { mac: macAddress, value: suhuVal });
            }

            // B. DATA TDS (Gabung dengan Suhu -> Simpan DB)
            else if (topicStr.endsWith("/dosing/data/tds_air")) {
                const tdsVal = parseFloat(messageStr);
                dosingStates[macAddress].tempTDS = tdsVal;

                console.log(`💧 [DOSING] TDS Masuk: ${tdsVal}. Menyimpan ke DB...`);
                io.emit('update_tds', { mac: macAddress, value: tdsVal });

                // GABUNGKAN DATA
                const dataToSave = {
                    tds: dosingStates[macAddress].tempTDS,
                    suhu: dosingStates[macAddress].tempSuhu, // Ambil suhu dari memori
                    pa: dosingStates[macAddress].pumpA,
                    pb: dosingStates[macAddress].pumpB
                };

                const device = await Devices.findOne({ where: { macAddress: macAddress } });
                
                if (device) {
                    await DosingData.create({
                        deviceId: device.id,
                        tds_air: dataToSave.tds,
                        suhu_air: dataToSave.suhu,
                        pompa_a_status: dataToSave.pa,
                        pompa_b_status: dataToSave.pb
                    });
                    console.log(`💾 [SUKSES] Data Tersimpan. ID Device: ${device.id}`);
                    io.emit('new_dosing_data'); 
                } else {
                    console.error(`⛔ [ERROR] Device MAC ${macAddress} tidak ditemukan di Database!`);
                }
            }

            // C. STATUS POMPA (Manual / Feedback)
            else if (topicStr.includes("/status/pumpA") || topicStr.includes("/set/manual_pump_a")) {
                const cleanMsg = messageStr.replace(/"/g, ''); 
                const status = (cleanMsg === "1" || cleanMsg === "ON") ? "ON" : "OFF";
                dosingStates[macAddress].pumpA = status;
                io.emit('update_pompa_a', status);
            }
            else if (topicStr.includes("/status/pumpB") || topicStr.includes("/set/manual_pump_b")) {
                const cleanMsg = messageStr.replace(/"/g, '');
                const status = (cleanMsg === "1" || cleanMsg === "ON") ? "ON" : "OFF";
                dosingStates[macAddress].pumpB = status;
                io.emit('update_pompa_b', status);
            }

        } catch (err) {
            console.error("❌ [DOSING ERROR]:", err.message);
        }
        return; 
    }

    // --------------------------------------------------------
    // 2. LOGIKA LAIN (SYNC, CLIMATE) - JANGAN DISENTUH
    // --------------------------------------------------------
    
    // Sync Jadwal
    const match = topicStr.match(syncRequestTopicPattern);
    if (match) {
        const macAddress = match[1].replace(/-/g, ':');
        handleSyncRequest(macAddress);
        return; 
    }

    const climateMatch = topicStr.match(climateSyncRequestTopicPattern);
    if (climateMatch) {
        const macAddress = climateMatch[1].replace(/-/g, ':');
        handleClimateSyncRequest(macAddress);
        return;
    }

    // Climate Hafizh
    if (topicStr.startsWith("hafizh11/esp32/alat/")) {
        // ... Logika Hafizh ...
        if (topicStr.endsWith("/status")) {
            try {
                const data = JSON.parse(messageStr);
                if (data.kipas1) {
                    lastRelay1State = data.kipas1; 
                    io.emit('update_relay_1', lastRelay1State);
                }
                if (data.kipas2) {
                    lastRelay2State = data.kipas2; 
                    io.emit('update_relay_2', lastRelay2State);
                }
            } catch (error) {}
            return;
        }

        if (topicStr.endsWith("/data")) {
            try {
                const macAddressWithHyphen = topicStr.split('/')[3]; 
                const macAddress = macAddressWithHyphen.replace(/-/g, ':');
                const device = await Devices.findOne({ where: { macAddress: macAddress } });
                if (!device) return;

                const data = JSON.parse(messageStr);
                const newClimateEntry = await ClimateData.create({
                    suhu: data.suhu,
                    kelembaban: data.kelembaban,
                    kipas1_status: lastRelay1State, 
                    kipas2_status: lastRelay2State, 
                    deviceId: device.id 
                });
                io.emit('update_suhu', data.suhu);
                io.emit('update_kelembaban', data.kelembaban);
                io.emit('new_historical_data');
                io.emit('new_climate_data', newClimateEntry);
            } catch (error) {
                 console.error(`Gagal memproses data climate:`, error.message);
            }
            return;
        }
    }
});

mqttClient.on('error', (err) => console.error('❌ Error MQTT:', err));
mqttClient.on('reconnect', () => console.log('🔄 Mencoba rekoneksi MQTT...'));

server.listen(PORT, () => console.log(`🚀 Server berjalan di http://localhost:${PORT}`));