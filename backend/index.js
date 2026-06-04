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
        FRONTEND_URL,"http://37.44.244.108:5173", "http://localhost:5173", "http://192.168.1.9:8081", "http://localhost:8081", "http://localhost:5000"
        // Tambahkan origin ini
    ]
})); 

// ✅ AKTIFKAN DAN KONFIGURASI CORS DI SINI
// app.use(cors({ credentials: true, origin: [FRONTEND_URL, 'http://192.168.1.9:8081'] }));
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
            const devices = await Devices.findAll({ where: { macAddress: formattedMacAddress } });
            if (!devices || devices.length === 0) {
                console.log(`Log diterima, tapi perangkat ${formattedMacAddress} tidak ditemukan.`);
                return;
            }

            // 3. Parse Payload
            const logData = JSON.parse(message.toString());

            // 4. Buat Log di Database
            await Promise.all(devices.map(async (device) => {
                const matchedSchedule = await Schedules.findOne({
                    where: {
                        nama: logData.nama,
                        userId: device.userId
                    },
                    include: [
                        {
                            model: Devices,
                            where: { id: device.id },
                            through: { attributes: [] }
                        }
                    ]
                });

                const scheduleKey =
                    logData.schedule_id ||
                    logData.scheduleId ||
                    logData.id ||
                    matchedSchedule?.id ||
                    logData.nama;

                const waktuKey = normalizeSingleWaktu(logData.waktu);
                const executionDate = getExecutionDateFromLogData(logData);

                const executionId = makeExecutionId(
                    device.id,
                    scheduleKey,
                    executionDate,
                    waktuKey
                );

                const timestampNumber = Number(logData.timestamp);

                const timestamp = Number.isFinite(timestampNumber)
                    ? new Date(timestampNumber > 9999999999 ? timestampNumber : timestampNumber * 1000)
                    : new Date();

                const internet =
                    logData.internet ||
                    logData.internet_status ||
                    logData.internetStatus ||
                    "Online";

                const status =
                    logData.status ||
                    logData.execution_status ||
                    logData.executionStatus ||
                    "SUCCESS";

                const reason =
                    logData.reason ||
                    (isFailedStatus(status) ? "DEVICE_OFFLINE" : "OK");

                const dataLog = {
                    executionId,
                    nama: logData.nama,
                    tanggal: logData.tanggal,
                    waktu: waktuKey,
                    durasi: logData.durasi,
                    solenoid: Array.isArray(logData.solenoid)
                        ? logData.solenoid.join(",")
                        : String(logData.solenoid),
                    internet,
                    status,
                    reason,
                    timestamp,
                    userId: device.userId,
                    deviceId: device.id
                };

                const existingLog = await ScheduleLog.findOne({
                    where: {
                        executionId,
                        deviceId: device.id
                    }
                });

                if (existingLog) {
                    const existingIsSuccess = isSuccessStatus(existingLog.status);
                    const incomingIsSuccess = isSuccessStatus(dataLog.status);

                    if (existingIsSuccess && !incomingIsSuccess) {
                        return;
                    }

                    await existingLog.update(dataLog);
                } else {
                    await ScheduleLog.create(dataLog);
                }
            }));
            console.log(`✅ Log jadwal untuk perangkat dengan MAC Address ${formattedMacAddress} berhasil disimpan.`);

        } catch (e) {
            console.error("Gagal memproses pesan log:", e);
        }
        return;
    }

    // Topik Info untuk Irigasi (misal: ezramnd/esp32/alat/IRRIGATION-XXXX/info)
    if (topicStr.endsWith("/info") && topicStr.startsWith(`${mqttOptions.username}/esp32/alat/IRRIGATION-`)) {
        try {
            // 1. Ekstrak MAC Address
            const combinedId = topicStr.split('/')[3]; 
            const separatorIndex = combinedId.indexOf('-');
            if (separatorIndex === -1) return;
            const simpleMacAddress = combinedId.substring(separatorIndex + 1);
            const formattedMacAddress = simpleMacAddress.match(/.{1,2}/g).join(':');

            // 2. Parse Payload JSON
            const data = JSON.parse(messageStr);

            // 3. Update Database
            const [updatedRows] = await Devices.update(
                { 
                    ipAddress: data.ipAddress, 
                    ssid: data.ssid,
                    firmware: data.firmware,
                },
                { where: { macAddress: formattedMacAddress } }
            );

            if (updatedRows > 0) {
                console.log(`✅ INFO JARINGAN berhasil diupdate untuk ${formattedMacAddress}.`);
                
                // 4. Kirim ke Frontend (Socket.IO)
                // Ini akan memicu listener 'device_status_update' di frontend dashboard
                io.emit('device_status_update', {
                    macAddress: formattedMacAddress,
                    ipAddress: data.ipAddress,
                    ssid: data.ssid,
                    firmware: data.firmware,
                    status: 'active' // Asumsi jika kirim info, dia pasti online
                });
            }
        } catch (error) {
            console.error(`❌ Gagal memproses data INFO dari ${topicStr}:`, error.message);
        }
        return;
    }

    if (topicStr.endsWith("/status") && topicStr.startsWith(`${mqttOptions.username}/esp32/alat/IRRIGATION-`)) {
        const combinedId = topicStr.split('/')[3]; //misal: IRRIGATION-4CC3820BE7D8

       try {
            // 1. Ekstrak MAC
            const separatorIndex = combinedId.indexOf('-');
            if (separatorIndex === -1) return;
            const simpleMacAddress = combinedId.substring(separatorIndex + 1);
            const formattedMacAddress = simpleMacAddress.match(/.{1,2}/g).join(':');

            // 2. Ambil Status
            const statusMsg = message.toString().toUpperCase(); // ONLINE/OFFLINE
            const dbStatus = (statusMsg === 'ONLINE') ? 'active' : 'inactive';
            
            // 3. Update DB (Seperti yang ditunjukkan log lokal)
            const [updatedRows] = await Devices.update(
                { status: dbStatus },
                { where: { macAddress: formattedMacAddress } }
            );

            if (updatedRows > 0) {
                // 4. Kirim ke Frontend (Socket.IO)
                io.emit('device_status_update', {
                    macAddress: formattedMacAddress,
                    status: dbStatus,
                    // Anda mungkin perlu mengambil data IP/SSID dari DB untuk pembaruan yang lengkap di frontend
                });
                console.log(`⚡ Device ${formattedMacAddress} is now ${statusMsg}`);
            }

        } catch (error) {
            console.error(`❌ Gagal memproses status IRRIGATION dari ${topicStr}:`, error.message);
        }
        return; // Hentikan proses setelah ditangani
    }

    //climate
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

                const devices = await Devices.findAll({ where: { macAddress: macAddress } });
                
                if (!devices || devices.length === 0) {
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
                await Promise.all(devices.map(async (device) => {
                    const lastSave = deviceLastSaveTime[device.id] || 0;

                    if (currentTime - lastSave >= SAVE_INTERVAL_MS) {
                        await ClimateData.create({
                            suhu: data.suhu,
                            kelembaban: data.kelembaban,
                            kipas1_status: finalKipas1,
                            kipas2_status: finalKipas2,
                            deviceId: device.id // ID unik milik masing-masing user
                        });
                        
                        deviceLastSaveTime[device.id] = currentTime;
                        console.log(`💾 [CLIMATE DB] Disimpan untuk UserID: ${device.userId}`);
                    }
                }));
            } catch (e) { console.error("Error data climate:", e.message); }
            return;
        }
    }

    // --------------------------------------------------------
    // 1. LOGIKA DOSING SYSTEM (AZIS) - FIXED SPLIT TOPIC
    // --------------------------------------------------------
    if (topicStr.startsWith(`${mqttOptions.username}/esp32/alat/`) && topicStr.includes("/dosing/")) {
        
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
                io.emit('suhu_air', { mac: macAddress, value: suhuVal });
            }

            // B. DATA TDS (LOGIKA INTERVAL 1 MENIT)
            else if (topicStr.endsWith("/dosing/data/tds_air")) {
                const tdsVal = parseFloat(messageStr);
                
                // 1. Update Memori Sementara
                dosingStates[macAddress].tempTDS = tdsVal;

                // 2. SELALU Kirim ke Socket.IO (Agar Website Real-time)
                // console.log(`💧 [REALTIME] TDS: ${tdsVal}`); 
                io.emit('update_tds', { mac: macAddress, value: tdsVal });

                // 3. LOGIKA INTERVAL PENYIMPANAN DATABASE
               const devices = await Devices.findAll({ where: { macAddress: macAddress } });
                
                if (devices && devices.length > 0) {
                    const currentTime = Date.now();
                    
                    // Loop penyimpanan untuk setiap user
                    await Promise.all(devices.map(async (device) => {
                        const lastSave = dosingLastSaveTime[device.id] || 0;

                        if (currentTime - lastSave >= DOSING_SAVE_INTERVAL_MS) {
                            
                            const dataToSave = {
                                tds: dosingStates[macAddress].tempTDS,
                                suhu: dosingStates[macAddress].tempSuhu,
                                pa: dosingStates[macAddress].pumpA,
                                pb: dosingStates[macAddress].pumpB
                            };

                            await DosingData.create({
                                deviceId: device.id, // ID unik per user
                                tds_air: dataToSave.tds,
                                suhu_air: dataToSave.suhu,
                                pompa_a_status: dataToSave.pa,
                                pompa_b_status: dataToSave.pb
                            });

                            dosingLastSaveTime[device.id] = currentTime;
                            console.log(`💾 [DOSING DB] Disimpan untuk UserID: ${device.userId}`);
                        }
                    }));
                    
                    io.emit('new_dosing_data'); 
                    
                } else {
                    console.error(`[ERROR] Device MAC ${macAddress} tidak ditemukan di Database!`);
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
});


mqttClient.on('error', (err) => console.error('❌ Error MQTT:', err));
mqttClient.on('reconnect', () => console.log('🔄 Mencoba rekoneksi MQTT...'));

const FAILED_CHECK_INTERVAL_MS = 60 * 1000;
const FAILED_TOLERANCE_MS = 2 * 60 * 1000;
const MAX_LOOKBACK_MS = 24 * 60 * 60 * 1000;

const FAILED_STATUS_VALUE = "Failed";
const OFFLINE_INTERNET_VALUE = "Offline";

function getJakartaDateFromDate(date) {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Jakarta",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(date);

    const year = parts.find(p => p.type === "year").value;
    const month = parts.find(p => p.type === "month").value;
    const day = parts.find(p => p.type === "day").value;

    return `${year}-${month}-${day}`;
}

function getExecutionDateFromLogData(logData) {
    const timestampNumber = Number(logData.timestamp);

    if (Number.isFinite(timestampNumber)) {
        const date = new Date(
            timestampNumber > 9999999999
                ? timestampNumber
                : timestampNumber * 1000
        );

        return getJakartaDateFromDate(date);
    }

    const dates = String(logData.tanggal || "").match(/\d{4}-\d{2}-\d{2}/g);

    if (dates && dates.length > 0) {
        return dates[0];
    }

    return getTodayDateJakarta();
}

function normalizeSingleWaktu(value) {
    const waktuList = normalizeWaktu(value);

    if (waktuList.length > 0) {
        return waktuList[0];
    }

    return String(value || "").slice(0, 5);
}

function makeExecutionId(deviceId, scheduleKey, executionDate, waktu) {
    return `${deviceId}_${scheduleKey}_${executionDate}_${waktu}`;
}

function isSuccessStatus(status) {
    const text = String(status || "").toLowerCase();
    return text === "success" || text === "berhasil";
}

function isFailedStatus(status) {
    const text = String(status || "").toLowerCase();
    return text === "failed" || text === "gagal";
}

function getTodayDateJakarta() {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Jakarta",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(new Date());

    const year = parts.find(p => p.type === "year").value;
    const month = parts.find(p => p.type === "month").value;
    const day = parts.find(p => p.type === "day").value;

    return `${year}-${month}-${day}`;
}

function normalizeToArray(value) {
    if (value === null || value === undefined) return [];

    if (Array.isArray(value)) return value;

    if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) return [];

        try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) return parsed;
        } catch (e) {}

        return trimmed
            .split(",")
            .map(item => item.trim())
            .filter(Boolean);
    }

    return [value];
}

function normalizeWaktu(value) {
    return normalizeToArray(value)
        .map(item => String(item).trim().slice(0, 5))
        .filter(item => /^\d{1,2}:\d{2}$/.test(item))
        .map(item => {
            const [hour, minute] = item.split(":");
            return `${hour.padStart(2, "0")}:${minute}`;
        });
}

function normalizeSolenoid(value) {
    return normalizeToArray(value)
        .map(item => String(item).trim())
        .filter(Boolean)
        .join(",");
}

function getDateOnly(value) {
    if (!value) return null;

    const text = String(value);
    const match = text.match(/\d{4}-\d{2}-\d{2}/);

    return match ? match[0] : null;
}

function getScheduleDateRange(schedule) {
    const startRaw =
        schedule.tanggalMulai ||
        schedule.tanggal_mulai ||
        schedule.tanggalAwal ||
        schedule.tanggal_awal ||
        schedule.startDate ||
        schedule.start_date ||
        schedule.mulai;

    const endRaw =
        schedule.tanggalSelesai ||
        schedule.tanggal_selesai ||
        schedule.tanggalAkhir ||
        schedule.tanggal_akhir ||
        schedule.endDate ||
        schedule.end_date ||
        schedule.selesai;

    const startDate = getDateOnly(startRaw);
    const endDate = getDateOnly(endRaw);

    if (startDate && endDate) {
        return { startDate, endDate };
    }

    const rangeRaw =
        schedule.tanggal ||
        schedule.rentangTanggal ||
        schedule.rentang_tanggal ||
        schedule.periode;

    if (rangeRaw) {
        const dates = String(rangeRaw).match(/\d{4}-\d{2}-\d{2}/g);

        if (dates && dates.length >= 2) {
            return {
                startDate: dates[0],
                endDate: dates[1]
            };
        }

        if (dates && dates.length === 1) {
            return {
                startDate: dates[0],
                endDate: dates[0]
            };
        }
    }

    return {
        startDate: null,
        endDate: null
    };
}

function getScheduleTanggalDisplay(schedule, dateRange) {
    // Jika di database schedule.tanggal sudah berisi rentang tanggal,
    // contoh: "2026-05-27 - 2026-05-30" atau "2026-05-27 s/d 2026-05-30"
    if (schedule.tanggal && String(schedule.tanggal).trim() !== "") {
        return String(schedule.tanggal).trim();
    }

    // Jika tanggal awal dan akhir ada di kolom terpisah
    if (dateRange.startDate && dateRange.endDate) {
        if (dateRange.startDate === dateRange.endDate) {
            return dateRange.startDate;
        }

        return `${dateRange.startDate} - ${dateRange.endDate}`;
        // Kalau ingin format s/d, pakai ini:
        // return `${dateRange.startDate} s/d ${dateRange.endDate}`;
    }

    // Cadangan terakhir
    return getTodayDateJakarta();
}

function isTodayInScheduleRange(today, range) {
    if (!range.startDate || !range.endDate) return false;

    return today >= range.startDate && today <= range.endDate;
}

function makeScheduleDateTimeJakarta(tanggal, waktu) {
    return new Date(`${tanggal}T${waktu}:00+07:00`);
}

async function createFailedLogsForMissedSchedules() {
    try {
        const schedules = await Schedules.findAll({
            include: [
                {
                    model: Devices,
                    through: { attributes: [] }
                }
            ]
        });

        const today = getTodayDateJakarta();
        const now = Date.now();

        for (const scheduleInstance of schedules) {
            const schedule = scheduleInstance.get
                ? scheduleInstance.get({ plain: true })
                : scheduleInstance;

            const relatedDevices = schedule.Devices || schedule.devices || [];

            if (!relatedDevices.length) continue;

            const dateRange = getScheduleDateRange(schedule);

            if (!isTodayInScheduleRange(today, dateRange)) {
                continue;
            }

            const tanggalDisplay = getScheduleTanggalDisplay(schedule, dateRange);

            const waktuList = normalizeWaktu(schedule.waktu);
            const solenoidLog = normalizeSolenoid(schedule.solenoid);

            if (!waktuList.length) continue;
            if (!solenoidLog) continue;

            for (const waktuItem of waktuList) {
                const scheduledAt = makeScheduleDateTimeJakarta(today, waktuItem);
                const diff = now - scheduledAt.getTime();

                // belum melewati waktu jadwal + toleransi
                if (diff < FAILED_TOLERANCE_MS) continue;

                // jangan proses jadwal terlalu lama
                if (diff > MAX_LOOKBACK_MS) continue;

                for (const device of relatedDevices) {
                    const deviceStatus = String(device.status || "").toLowerCase();

                    if (deviceStatus !== "inactive") continue;

                    const offlineSince = device.lastOfflineAt
                        ? new Date(device.lastOfflineAt)
                        : null;

                    // INI BAGIAN PENTING:
                    // kalau alat baru offline setelah jam jadwal,
                    // jangan anggap jadwal lama sebagai failed
                    if (offlineSince && scheduledAt < offlineSince) {
                        continue;
                    }

                    const executionDate = today;
                    const executionId = makeExecutionId(
                        device.id,
                        schedule.id,
                        executionDate,
                        waktuItem
                    );
                    await ScheduleLog.findOrCreate({
                        where: {
                            executionId,
                            deviceId: device.id
                        },
                        defaults: {
                            executionId,
                            nama: schedule.nama,
                            tanggal: tanggalDisplay,
                            waktu: waktuItem,
                            durasi: schedule.durasi,
                            solenoid: solenoidLog,
                            internet: OFFLINE_INTERNET_VALUE,
                            status: FAILED_STATUS_VALUE,
                            reason: "DEVICE_OFFLINE",
                            timestamp: scheduledAt,
                            userId: device.userId,
                            deviceId: device.id
                        }
                    });
                }
            }
        }
    } catch (error) {
        console.error("❌ Gagal membuat log jadwal gagal:", error.message);
    }
}

setInterval(createFailedLogsForMissedSchedules, FAILED_CHECK_INTERVAL_MS);

// Kita tidak lagi butuh on('message') atau Socket.IO di sini
server.listen(PORT, () => console.log(`🚀 Server berjalan di ${process.env.APP_URL}:${PORT}`));

