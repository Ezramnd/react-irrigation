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
// --- IMPORT MODEL DOSING ---
import DosingSettings from "./models/DosingSettingsModel.js";
import DosingData from "./models/DosingDataModel.js";

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

//dosing
const dosingStates = {};

// --- TAMBAHAN BARU (INTERVAL 1 MENIT- 9 DES) ---
const dosingLastSaveTime = {}; // Menyimpan waktu terakhir save per device ID
const DOSING_SAVE_INTERVAL_MS = 30 * 1000; // 30 Detik (30.000 ms)

//climate
let lastRelay1State = "OFF";
let lastRelay2State = "OFF";

io.on('connection', (socket) => {
    console.log('✅ Frontend terhubung via Socket.IO:', socket.id);

    // Kirim status tersimpan ke klien yang baru terhubung
    console.log(`Mengirim status tersimpan ke ${socket.id}: Kipas1=${lastRelay1State}, Kipas2=${lastRelay2State}`);
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
    await DosingData.sync(); 
    await DosingSettings.sync(); 
} catch (error) { console.error('❌ Database Error:', error); }
// Izinkan semua origin, atau tentukan array origin

// ✅ AKTIFKAN DAN KONFIGURASI CORS DI SINI
app.use(cors({
    credentials: true,
    origin: [
        FRONTEND_URL, "http://localhost:5173", "http://localhost:5173", "http://localhost:5000", "http://localhost:8081", "http://localhost:8081", "http://localhost:5000"
        // Tambahkan origin ini
    ]
})); 

// ✅ AKTIFKAN DAN KONFIGURASI CORS DI SINI
// app.use(cors({ credentials: true, origin: [FRONTEND_URL, 'http://localhost:8081'] }));
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
    const IrrigationStatusTopic = `${mqttOptions.username}/esp32/alat/+/status`;
    mqttClient.subscribe(IrrigationStatusTopic, (err) => {
        if (!err) {
            console.log(`✅ Berhasil subscribe ke topik status alat: ${IrrigationStatusTopic}`);
        } else {
            console.error(`❌ Gagal subscribe ke ${IrrigationStatusTopic}:`, err);
        }
    });
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
      // Subscribe Topik Dosing (Azis)
    const dosingTopic = `${mqttOptions.username}/esp32/alat/+/dosing/#`; 
    mqttClient.subscribe(dosingTopic, (err) => {
        if (!err) console.log(`✅ Berhasil subscribe ke Dosing System: ${dosingTopic}`);
        else console.error(`❌ Gagal subscribe Dosing:`, err);
    });
});

mqttClient.on('message', async (topic, message) => {
    const topicStr = topic.toString();
    const messageStr = message.toString();

    // console.log(`📨 Pesan di topik: ${topicStr}`); // Debugging (Opsional)

    // -------------------------------------------------------------------------
    // 1. HANDLER: SYNC REQUEST (Jadwal Irigasi Lama)
    // -------------------------------------------------------------------------
    const match = topicStr.match(syncRequestTopicPattern);
    if (match) {
        const combinedId = match[1]; 
        const separatorIndex = combinedId.indexOf('-');
        if (separatorIndex === -1) return;

        const deviceType = combinedId.substring(0, separatorIndex);
        const simpleMacAddress = combinedId.substring(separatorIndex + 1);
        const formattedMacAddress = simpleMacAddress.match(/.{1,2}/g).join(':');

        console.log(`Identifikasi Alat (Sync): Tipe=${deviceType}, MAC=${formattedMacAddress}`);
        handleSyncRequest(formattedMacAddress);
        return; 
    }

    // -------------------------------------------------------------------------
    // 2. HANDLER: LOG JADWAL (Irigasi Lama)
    // -------------------------------------------------------------------------
    const logMatch = topicStr.match(logTopicPattern);
    if (logMatch) {
        try {
            const combinedId = logMatch[1];
            const separatorIndex = combinedId.indexOf('-');
            if (separatorIndex === -1) return;
            
            const simpleMacAddress = combinedId.substring(separatorIndex + 1);
            const formattedMacAddress = simpleMacAddress.match(/.{1,2}/g).join(':');

            const device = await Devices.findOne({ where: { macAddress: formattedMacAddress } });
            if (!device) return;

            const logData = JSON.parse(messageStr);
            await ScheduleLog.create({
                nama: logData.nama,
                tanggal: logData.tanggal,
                waktu: logData.waktu,
                durasi: logData.durasi,
                solenoid: logData.solenoid,
                internet: logData.internet,
                status: logData.status,
                timestamp: new Date(logData.timestamp * 1000), 
                userId: device.userId,
                deviceId: device.id
            });
            console.log(`✅ Log jadwal tersimpan: ${device.nama}`);
        } catch (e) {
            console.error("Gagal proses log:", e);
        }
        return;
    }

    // -------------------------------------------------------------------------
    // 3. HANDLER: STATUS ONLINE/OFFLINE PERANGKAT (IRRIGATION)
    // -------------------------------------------------------------------------
    if (topicStr.endsWith("/status") && topicStr.includes("IRRIGATION-")) {
        // ... (Kode status irrigation Anda tetap sama) ...
        try {
            const parts = topicStr.split('/'); // Asumsi struktur topic standar
            // Cari bagian yang berisi "IRRIGATION-"
            const deviceIdPart = parts.find(p => p.startsWith("IRRIGATION-"));
            if(!deviceIdPart) return;

            const simpleMac = deviceIdPart.split('-')[1];
            const formattedMac = simpleMac.match(/.{1,2}/g).join(':');
            
            const statusMsg = messageStr.toUpperCase();
            const dbStatus = (statusMsg === 'ONLINE') ? 'active' : 'inactive';

            await Devices.update({ status: dbStatus }, { where: { macAddress: formattedMac } });
            io.emit('device_status_update', { macAddress: formattedMac, status: dbStatus });
        } catch (e) { console.error("Error status irrigation:", e.message); }
        return;
    }

    // -------------------------------------------------------------------------
    // 4. HANDLER: CLIMATE SYSTEM (ESP32 Climate)
    // -------------------------------------------------------------------------
    // Ciri Khas: Topik mengandung "/climate/"
    if (topicStr.includes("/climate/esp32/alat/")) {
        
        // A. Sync Request Climate
        const climateMatch = topicStr.match(climateSyncRequestTopicPattern);
        if (climateMatch) {
            const macAddress = climateMatch[1].replace(/-/g, ':');
            handleClimateSyncRequest(macAddress);
            return;
        }

        // B. Status Kipas (Update Realtime)
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
            } catch (e) { console.error("Error status climate:", e.message); }
            return;
        }

        // C. Data Sensor Climate (Suhu/Kelembaban)
        if (topicStr.endsWith("/data")) {
            try {
                const parts = topicStr.split('/');
                // Asumsi struktur: username/climate/esp32/alat/[MAC]/data
                const macPart = parts[4]; 
                const macAddress = macPart.replace(/-/g, ':');

                const device = await Devices.findOne({ where: { macAddress: macAddress } });
                if (!device) {
                    console.warn(`Climate Data: Device ${macAddress} tidak dikenal.`);
                    return;
                }

                const data = JSON.parse(messageStr);

                // Update Status Kipas Realtime (Priority dari Data Sensor)
                let finalKipas1 = lastRelay1State;
                let finalKipas2 = lastRelay2State;

                if (data.kipas1) finalKipas1 = data.kipas1;
                if (data.kipas2) finalKipas2 = data.kipas2;
                
                // Update Global Var & Socket
                lastRelay1State = finalKipas1;
                lastRelay2State = finalKipas2;
                io.emit('update_relay_1', finalKipas1);
                io.emit('update_relay_2', finalKipas2);
                io.emit('update_suhu', data.suhu);
                io.emit('update_kelembaban', data.kelembaban);

                // --- LOGIKA SIMPAN DATABASE (30 Detik) ---
                const currentTime = Date.now();
                const lastSave = deviceLastSaveTime[device.id] || 0;

                if (currentTime - lastSave >= SAVE_INTERVAL_MS) {
                    await ClimateData.create({
                        suhu: data.suhu,
                        kelembaban: data.kelembaban,
                        kipas1_status: finalKipas1,
                        kipas2_status: finalKipas2,
                        deviceId: device.id
                    });
                    
                    deviceLastSaveTime[device.id] = currentTime;
                    
                    io.emit('new_historical_data');
                    console.log(`💾 [CLIMATE DB] Data tersimpan ${device.nama} (Interval 30s).`);
                }
            } catch (e) { console.error("Error data climate:", e.message); }
            return;
        }
    }

    // -------------------------------------------------------------------------
    // 5. HANDLER: DOSING SYSTEM
    // -------------------------------------------------------------------------
    // Ciri Khas: Topik mengandung "/dosing/"
    if (topicStr.includes("/dosing/")) {
        try {
            // Ambil MAC Address (Asumsi: username/esp32/alat/[MAC]/dosing/...)
            const parts = topicStr.split('/');
            const macPart = parts[3]; 
            const macAddress = macPart.replace(/-/g, ':').toLowerCase();

            // Init State Memory jika belum ada
            if (!dosingStates[macAddress]) {
                dosingStates[macAddress] = { pumpA: "OFF", pumpB: "OFF", tempSuhu: 0, tempTDS: 0 };
            }

            // A. Data Suhu Dosing
            if (topicStr.endsWith("/suhu_air")) {
                const suhuVal = parseFloat(messageStr);
                dosingStates[macAddress].tempSuhu = suhuVal;
                io.emit('suhu_air', { mac: macAddress, value: suhuVal });
            } 
            
            // B. Data TDS Dosing (Trigger Simpan DB)
            else if (topicStr.endsWith("/tds_air")) {
                const tdsVal = parseFloat(messageStr);
                dosingStates[macAddress].tempTDS = tdsVal;
                io.emit('update_tds', { mac: macAddress, value: tdsVal });

                // --- LOGIKA SIMPAN DATABASE (30 Detik / 1 Menit) ---
                const device = await Devices.findOne({ where: { macAddress: macAddress } });
                
                if (device) {
                    const currentTime = Date.now();
                    const lastSave = dosingLastSaveTime[device.id] || 0;

                    // Gunakan variabel interval khusus Dosing (DOSING_SAVE_INTERVAL_MS)
                    if (currentTime - lastSave >= DOSING_SAVE_INTERVAL_MS) {
                        
                        await DosingData.create({
                            deviceId: device.id,
                            tds_air: dosingStates[macAddress].tempTDS,
                            suhu_air: dosingStates[macAddress].tempSuhu,
                            pompa_a_status: dosingStates[macAddress].pumpA,
                            pompa_b_status: dosingStates[macAddress].pumpB
                        });

                        dosingLastSaveTime[device.id] = currentTime;
                        io.emit('new_dosing_data');
                        console.log(`💾 [DOSING DB] Data tersimpan ID: ${device.id} (Interval 30s/1m).`);
                    }
                }
            }

            // C. Status Pompa
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

        } catch (e) { console.error("Error dosing:", e.message); }
        return;
    }
});


mqttClient.on('error', (err) => console.error('❌ Error MQTT:', err));
mqttClient.on('reconnect', () => console.log('🔄 Mencoba rekoneksi MQTT...'));

// Kita tidak lagi butuh on('message') atau Socket.IO di sini
server.listen(PORT, () => console.log(`🚀 Server berjalan di ${process.env.APP_URL}:${PORT}`));

