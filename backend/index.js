import express from "express";
import http from 'http';
import { Server } from 'socket.io';
import mqtt from 'mqtt';
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
// import { Op } from 'sequelize';
import db from "./config/Database.js";

import Users from "./models/UserModel.js";
import Devices from "./models/DeviceModel.js";
import Schedules from "./models/ScheduleModel.js";
import ClimateSchedules from "./models/ClimateScheduleModel.js";
import ClimateData from "./models/ClimateDataModel.js";
import router from "./routes/index.js";
import { setMqttClient, subscribeToDeviceStatus } from './mqttNotifier.js';
import { initializeRealtimeManager } from './realtimeManager.js';
import { handleSyncRequest } from "./controllers/ScheduleController.js";
import { handleClimateSyncRequest } from "./controllers/ClimateScheduleController.js"; 



// Relasi User <-> Device
Users.hasMany(Devices, { foreignKey: 'userId' });
Devices.belongsTo(Users, { foreignKey: 'userId' });

// Relasi User <-> Jadwal Irigasi
Users.hasMany(Schedules, { foreignKey: 'userId' });
Schedules.belongsTo(Users, { foreignKey: 'userId' });

// Relasi Many-to-Many: Device <-> Jadwal Irigasi
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


let lastRelay1State = "OFF";
let lastRelay2State = "OFF";
const MQTT_BROKER_URL = 'mqtt://103.127.97.247';
const FRONTEND_URL = "http://localhost:5173";
const PORT = 5000;
dotenv.config();

const app = express();
const server = http.createServer(app);

export const io = new Server(server, {
cors: {
    origin: "http://localhost:5173" 
}
});

io.on('connection', (socket) => {
console.log('✅ Frontend terhubung via Socket.IO:', socket.id);

// Kirim status tersimpan ke klien yang baru terhubung
console.log(`Mengirim status tersimpan ke ${socket.id}: Kipas1=${lastRelay1State}, Kipas2=${lastRelay2State}`);
socket.emit('update_relay_1', lastRelay1State);
socket.emit('update_relay_2', lastRelay2State);

socket.on('disconnect', () => {
console.log('Frontend terputus:', socket.id);
});
});




try {
await db.authenticate();
console.log('✅ Database Connected');
await db.sync(); 
} catch (error) { console.error('❌ Database Error:', error); }

app.use(cors({ credentials: true, origin: [FRONTEND_URL, 'http://localhost:8081'] }));
app.use(cookieParser());
app.use(express.json());
app.use(router);

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

const syncTopic = 'esp32/alat/+/jadwal/get';
mqttClient.subscribe(syncTopic, (err) => {
    if (!err) {
            console.log(`✅ Berhasil subscribe ke topik sinkronisasi: ${syncTopic}`);
    } else {
            console.error(`❌ Gagal subscribe ke ${syncTopic}:`, err);
    }
});

const climateSyncTopic = 'hafizh11/esp32/alat/+/climate-jadwal/get';
mqttClient.subscribe(climateSyncTopic, (err) => {
        if (!err) {
            console.log(`✅ Berhasil subscribe ke topik sinkronisasi climate: ${climateSyncTopic}`);
        } else {
            console.error(`❌ Gagal subscribe ke ${climateSyncTopic}:`, err);
        }
});

// const sensorTopics = [
//     'hafizh11/greenhouse/relay/1/status', 
//     'hafizh11/greenhouse/relay/2/status'    
// ];

// mqttClient.subscribe(sensorTopics, (err) => {
//     if (!err) {
//             console.log('✅ Berhasil subscribe ke topik status relay LAMA');
//     } else {
//             console.error('❌ Gagal subscribe topik sensor/status:', err);
//     }
// });

const dataTopic = "hafizh11/esp32/alat/+/data";
mqttClient.subscribe(dataTopic, (err) => {
    if (!err) {
        console.log(`✅ Berhasil subscribe ke topik data sensor BARU: ${dataTopic}`);
    } else {
            console.error(`❌ Gagal subscribe ke ${dataTopic}:`, err);
    }
});

const statusTopic = "hafizh11/esp32/alat/+/status";
mqttClient.subscribe(statusTopic, (err) => {
    if (!err) {
        console.log(`✅ Berhasil subscribe ke topik status BARU: ${statusTopic}`);
    } else {
            console.error(`❌ Gagal subscribe ke ${statusTopic}:`, err);
    }
});

});

mqttClient.on('message', async (topic, message) => {
const topicStr = topic.toString();
const messageStr = message.toString(); 

console.log(`[MQTT] Topik: ${topicStr}, Pesan: ${messageStr}`);

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

if (topicStr.startsWith("hafizh11/esp32/alat/") && topicStr.endsWith("/status")) {
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

if (topicStr.startsWith("hafizh11/esp32/alat/") && topicStr.endsWith("/data")) {
        try {
            const macAddressWithHyphen = topicStr.split('/')[3]; 
            const macAddress = macAddressWithHyphen.replace(/-/g, ':');
            console.log(`[Debug] Mencari device dengan MAC (format colon): ${macAddress}`);

            const device = await Devices.findOne({ where: { macAddress: macAddress } });
            if (!device) {
                console.warn(`Data sensor diterima dari MAC ${macAddress} yang tidak terdaftar.`);
                return;
            }

            const data = JSON.parse(messageStr);
            
            const newClimateEntry = await ClimateData.create({
                suhu: data.suhu,
                kelembaban: data.kelembaban,
                kipas1_status: lastRelay1State, 
                kipas2_status: lastRelay2State, 
                deviceId: device.id 
            });

            console.log(`✅ Data sensor dari ${macAddress} (ID: ${device.id}) berhasil disimpan.`);

            io.emit('update_suhu', data.suhu);
            io.emit('update_kelembaban', data.kelembaban);
            io.emit('new_historical_data');
            io.emit('new_climate_data', newClimateEntry);
            
        } catch (error) {
            console.error(`Gagal memproses/menyimpan data sensor dari ${topicStr}:`, error.message);
        }
        return; 
        }
});

mqttClient.on('error', (err) => console.error('❌ Error MQTT:', err));
mqttClient.on('reconnect', () => console.log('🔄 Mencoba rekoneksi MQTT...'));

server.listen(PORT, () => console.log(`🚀 Server berjalan di http://localhost:${PORT}`));