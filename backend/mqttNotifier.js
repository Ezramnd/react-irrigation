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
        const statusTopic = `${mqttClient.options.username}/esp32/status/${macTopic}`;
        
        mqttClient.subscribe(statusTopic, (err) => {
            if (!err) {
                console.log(`✅ Langsung subscribe ke topik status baru: ${statusTopic}`);
            } else {
                console.error(`❌ Gagal subscribe ke ${statusTopic}:`, err);
            }
        });
    }
};

export const publishCommand = (macAddress, payload) => {
    
    if (mqttClient && mqttClient.connected && mqttClient.options) {
        const username = mqttClient.options.username; 

        const macTopic = macAddress.replace(/:/g, '').toUpperCase();
        
        // Asumsi Topik Perintah Manual: [username]/cmnd/[macAddress]/ManualControl
        // Sesuaikan jika topik command Anda berbeda (misal: [username]/esp32/alat/[macAddress]/manual)
        const fullTopic = `${username}/esp32/alat/IRRIGATION-${macTopic}/manual/set`;

        mqttClient.publish(fullTopic, JSON.stringify(payload), { qos: 1 }, (err) => {
            if (!err) {
                console.log(`✅ MQTT Command terkirim ke topik ${fullTopic}:`, payload);
            } else {
                console.error(`❌ Gagal mengirim perintah ke ${fullTopic}:`, err);
            }
        });
        return true; // Perintah dikirim (meski mungkin gagal di koneksi)
    } else {
        console.error("❌ MQTT tidak terhubung, perintah kontrol manual gagal dikirim.");
        return false; // Perintah gagal dikirim
    }
};

// Fungsi ini akan kita panggil dari controller
export const publishScheduleUpdate = (topic, payload) => {
    // Pastikan client ada, terhubung, dan punya options
    if (mqttClient && mqttClient.connected && mqttClient.options) {
        const username = mqttClient.options.username; // <-- AMBIL USERNAME
        const fullTopic = `${username}/${topic}`; // <-- BUAT TOPIK LENGKAP

        mqttClient.publish(fullTopic, JSON.stringify(payload), { qos: 1 }, (err) => {
            if (!err) {
                // Gunakan fullTopic di log
                console.log(`✅ Notifikasi jadwal terkirim ke topik ${fullTopic}:`, payload);
            } else {
                // Gunakan fullTopic di log error
                console.error(`❌ Gagal mengirim notifikasi ke ${fullTopic}:`, err);
            }
        });
    } else {
        console.error("❌ MQTT tidak terhubung, notifikasi jadwal gagal dikirim.");
    }
};
