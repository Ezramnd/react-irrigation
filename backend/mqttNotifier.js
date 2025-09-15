// backend/mqttNotifier.js

// Variabel ini akan diisi oleh index.js
let mqttClient = null;

export const setMqttClient = (client) => {
    mqttClient = client;
};

// --- TAMBAHKAN FUNGSI BARU INI ---
export const subscribeToDeviceStatus = (macAddress) => {
    if (mqttClient && mqttClient.connected && macAddress) {
        const macTopic = macAddress.replace(/:/g, '-');
        const statusTopic = `esp32/status/${macTopic}`;
        
        mqttClient.subscribe(statusTopic, (err) => {
            if (!err) {
                console.log(`✅ Langsung subscribe ke topik status baru: ${statusTopic}`);
            } else {
                console.error(`❌ Gagal subscribe ke ${statusTopic}:`, err);
            }
        });
    }
};

// Fungsi ini akan kita panggil dari controller
export const publishScheduleUpdate = (topic, payload) => {
    if (mqttClient && mqttClient.connected) {
        mqttClient.publish(topic, JSON.stringify(payload), { qos: 1 }, (err) => {
            if (!err) {
                console.log(`✅ Notifikasi jadwal terkirim ke topik ${topic}:`, payload);
            } else {
                console.error(`❌ Gagal mengirim notifikasi ke ${topic}:`, err);
            }
        });
    } else {
        console.error("❌ MQTT tidak terhubung, notifikasi jadwal gagal dikirim.");
    }
};
