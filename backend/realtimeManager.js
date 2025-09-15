import Devices from './models/DeviceModel.js';


// Topik MQTT didefinisikan di sini
const TOPICS = {
    CONTROL: 'esp32/led/control',
    STATUS: 'esp32/status',
    INFO: 'esp32/info'
};

// Variabel untuk menyimpan state perangkat secara real-time
let esp32DeviceData = {
    id: 'ESP32Client-RuangKontrol', // Sesuaikan dengan ClientID di ESP32 Anda
    namaEsp: 'ESP32 Ruang Kontrol',
    lokasi: 'Gudang Utama',
    status: 'inactive',
    detail: {
        ipAddress: 'N/A',
        chipId: 'N/A',
        firmware: 'N/A',
        mqtt: { status: 'disconnected', broker: '' },
        wifi: { ssid: 'N/A' },
        history: []
    }
};

// Fungsi utama yang akan kita panggil dari index.js
export function initializeRealtimeManager(io, mqttClient) {
    esp32DeviceData.detail.mqtt.broker = mqttClient.options.href;

    // --- LOGIKA MQTT ---
    mqttClient.on('connect', () => {
        esp32DeviceData.detail.mqtt.status = 'connected';
        const allTopics = [TOPICS.STATUS, TOPICS.INFO];
        mqttClient.subscribe(allTopics, (err) => {
            if (!err) console.log(`✅ Manajer Real-time subscribe ke: ${allTopics.join(', ')}`);
        });
        io.emit('device-update', esp32DeviceData);
    });

    mqttClient.on('error', () => {
        esp32DeviceData.detail.mqtt.status = 'disconnected';
        io.emit('device-update', esp32DeviceData);
    });

    mqttClient.on('message', async (topic, message) => {
        const messageStr = message.toString();
        console.log(`📩 Manajer Real-time menerima pesan: [${topic}] ${messageStr}`);

        const logEntry = { timestamp: new Date().toLocaleTimeString('id-ID'), message: `[${topic.split('/').pop()}] ${messageStr}` };
        esp32DeviceData.detail.history.unshift(logEntry);
        if (esp32DeviceData.detail.history.length > 20) esp32DeviceData.detail.history.pop();

        if (topic === TOPICS.STATUS) {  
            esp32DeviceData.status = messageStr === 'online' ? 'active' : 'inactive';
        } else if (topic === TOPICS.INFO) {
            try {
                const info = JSON.parse(messageStr);
                esp32DeviceData.detail.ipAddress = info.ipAddress;
                esp32DeviceData.detail.chipId = info.chipId;
                esp32DeviceData.detail.firmware = info.firmware;
                esp32DeviceData.detail.wifi.ssid = info.ssid;

                // --- 3. LOGIKA BARU: UPDATE DATABASE ---
                console.log(`Mencari perangkat di database dengan MAC Address: ${info.chipId}`);
                await Devices.update(
                    { ssid: info.ssid }, // Data yang ingin di-update
                    { where: { macAddress: info.chipId } } // Cari perangkat dengan MAC Address yang cocok
                );
                console.log(`✅ Database diperbarui untuk perangkat dengan MAC Address ${info.chipId}`);

            } catch (e) {
                console.error("Gagal parse JSON dari topik info:", e);
            }
        }

        io.emit('device-update', esp32DeviceData);
    });

    // --- LOGIKA SOCKET.IO ---
    io.on('connection', (socket) => {
        console.log('✅ Client web terhubung ke Manajer Real-time:', socket.id);
        socket.emit('device-update', esp32DeviceData);

        socket.on('perintah-led', (command) => {
            console.log(`📤 Manajer Real-time menerima perintah dari web:`, command);
            if (mqttClient && mqttClient.connected) {
                mqttClient.publish(TOPICS.CONTROL, command);
                const logEntry = { timestamp: new Date().toLocaleTimeString('id-ID'), message: `CMD: ${command}` };
                esp32DeviceData.detail.history.unshift(logEntry);
                io.emit('device-update', esp32DeviceData);
            }
        });

        socket.on('disconnect', () => {
            console.log('❌ Client web terputus dari Manajer Real-time:', socket.id);
        });
    });
}