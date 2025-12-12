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
        FRONTEND_URL, "http://localhost:5173", "http://37.44.244.108:8081", "http://localhost:8081", "http://localhost:5000"
        // Tambahkan origin ini
    ]
})); 

// ✅ AKTIFKAN DAN KONFIGURASI CORS DI SINI
// app.use(cors({ credentials: true, origin: [FRONTEND_URL, 'http://37.44.244.108:8081'] }));
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
            console.log(`[Debug] Mencari device dengan MAC (format colon): ${macAddress}`);

            const device = await Devices.findOne({ where: { macAddress: macAddress } });
            if (!device) {
                console.warn(`Data sensor diterima dari MAC ${macAddress} yang tidak terdaftar.`);
                return;
            }

            const messageStr = message.toString();

            const data = JSON.parse(messageStr);
            
            // 1. Ambil status TERAKHIR dari Database (Bukan dari variabel global server)
            // Ini penting agar server 'sadar' jika baru saja ada perubahan manual via Controller
            const lastLog = await ClimateData.findOne({
                where: { deviceId: device.id },
                order: [['createdAt', 'DESC']], // Ambil yang paling baru
            });

            // 2. Tentukan status default berdasarkan database terakhir
            let finalKipas1 = lastLog ? lastLog.kipas1_status : "OFF";
            let finalKipas2 = lastLog ? lastLog.kipas2_status : "OFF";

            // 3. Jika paket data sensor MENGANDUNG status kipas, update statusnya.
            // (Jika sensor hanya kirim suhu, status kipas tetap ikut database terakhir/Manual)
            if (data.kipas1) finalKipas1 = data.kipas1;
            if (data.kipas2) finalKipas2 = data.kipas2;

              // --------------8DES---------------------
            lastRelay1State = finalKipas1;
            lastRelay2State = finalKipas2;

            // 4. Update Socket IO agar tampilan frontend real-time
            io.emit('update_relay_1', finalKipas1);
            io.emit('update_relay_2', finalKipas2);

            // 5. Simpan Log Baru
            const newClimateEntry = await ClimateData.create({
                suhu: data.suhu,
                kelembaban: data.kelembaban,
                kipas1_status: finalKipas1, // Gunakan status yang sudah disinkronkan
                kipas2_status: finalKipas2, 
                deviceId: device.id 
            });

            console.log(`✅ Data sensor dari ${macAddress} (ID: ${device.id}) berhasil disimpan.`);

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
                io.emit('update_suhu', { mac: macAddress, value: suhuVal });
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
                const device = await Devices.findOne({ where: { macAddress: macAddress } });
                
                if (device) {
                    const currentTime = Date.now();
                    const lastSave = dosingLastSaveTime[device.id] || 0; // Waktu simpan terakhir

                    // Cek: Apakah sudah berlalu 1 Menit (60.000ms) sejak simpan terakhir?
                    if (currentTime - lastSave >= DOSING_SAVE_INTERVAL_MS) {
                        
                        // Siapkan Data
                        const dataToSave = {
                            tds: dosingStates[macAddress].tempTDS,
                            suhu: dosingStates[macAddress].tempSuhu,
                            pa: dosingStates[macAddress].pumpA,
                            pb: dosingStates[macAddress].pumpB
                        };

                        // Simpan ke Database
                        await DosingData.create({
                            deviceId: device.id,
                            tds_air: dataToSave.tds,
                            suhu_air: dataToSave.suhu,
                            pompa_a_status: dataToSave.pa,
                            pompa_b_status: dataToSave.pb
                        });

                        // Update Waktu Simpan Terakhir menjadi SEKARANG
                        dosingLastSaveTime[device.id] = currentTime;

                        console.log(`[DATABASE] Data Dosing Tersimpan (Interval 1 Menit). ID: ${device.id}`);
                        io.emit('new_dosing_data'); // Trigger tabel history di frontend refresh
                    } else {
                        // Jika belum 1 menit, abaikan penyimpanan DB (hanya update RAM/Socket)
                        // console.log(`[SKIP DB] Belum 1 menit.`);
                    }
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

// Kita tidak lagi butuh on('message') atau Socket.IO di sini
server.listen(PORT, () => console.log(`🚀 Server berjalan di ${process.env.APP_URL}:${PORT}`));

