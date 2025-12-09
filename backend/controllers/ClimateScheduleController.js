// controllers/ClimateScheduleController.js
import { io } from "../index.js";
import ClimateSchedules from "../models/ClimateScheduleModel.js"; 
import Devices from "../models/DeviceModel.js";
import { publishScheduleUpdate } from "../mqttNotifier.js";
import ClimateSettings from "../models/ClimateSettingsModel.js";
import ClimateData from "../models/ClimateDataModel.js";
import { Op } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const createClimateManualTopicFromMac = (macAddress) => {
    if (!macAddress) return null;
    let topicMac = macAddress.replace(/:/g, '-');
    //kontrol manual climate
    return `climate/esp32/alat/${topicMac}/climate-manual/set`; 
}

const createClimateTopicFromMac = (macAddress) => {
    if (!macAddress) return null;
    let topicMac = macAddress.replace(/:/g, '-');
    return `climate/esp32/alat/${topicMac}/climate-jadwal/set`; //8DES 
}

const createClimateSettingsTopicFromMac = (macAddress) => {
    if (!macAddress) return null;
    let topicMac = macAddress.replace(/:/g, '-');
    return `climate/esp32/alat/${topicMac}/climate-settings/set`; //8DES
}

const createClimateModeTopicFromMac = (macAddress) => {
    if (!macAddress) return null;
    let topicMac = macAddress.replace(/:/g, '-');
    return `climate/esp32/alat/${topicMac}/climate-mode/set`; //8DES
}

export const manualClimateControl = async (req, res) => {
    const { deviceId } = req.params;
    // Body akan berisi: { "target": "fan1", "state": "ON" }
    // atau: { "target": "fan2", "state": "OFF" }
    const { target, state } = req.body; 

    // Validasi input sederhana
    if (!target || !state || (target !== 'fan1' && target !== 'fan2')) {
        return res.status(400).json({ msg: "Request body tidak valid. Harus menyertakan 'target' (fan1/fan2) dan 'state' (ON/OFF)." });
    }

    try {
        const device = await Devices.findByPk(deviceId);
        if (!device) return res.status(404).json({ msg: "Alat tidak ditemukan" });

        console.log("DEBUG MANUAL CONTROL:");
        console.log("Device ID:", deviceId);
        console.log("Current Mode in DB:", device.controlMode);
        console.log("Request Role:", req.role);
        console.log("Device Owner ID:", device.userId);
        console.log("Request User ID:", req.userId);
        // -----------------------------------------

        // Cek otorisasi
        if (req.role !== "admin" && device.userId !== req.userId) {
                return res.status(403).json({ msg: "Akses ditolak" });
        }
        if (device.controlMode !== 'manual') {
            return res.status(403).json({ msg: "Perintah ditolak. Alat tidak dalam mode manual." });
        }

        const topic = createClimateManualTopicFromMac(device.macAddress);
        if (topic) {
            const payload = { target, state };
            publishScheduleUpdate(topic, payload);
        } else {
            return res.status(400).json({ msg: "Alat tidak memiliki MAC Address." });
        }

        // A. Ambil data terakhir untuk menjaga kontinuitas Suhu, Kelembaban, dan Kipas Lainnya
        const lastData = await ClimateData.findOne({
            where: { deviceId: deviceId },
            order: [['createdAt', 'DESC']]
        });

        // Default value jika belum ada data sama sekali
        let currentSuhu = 0;
        let currentKelembaban = 0;
        let statusKipas1 = 'OFF';
        let statusKipas2 = 'OFF';

        if (lastData) {
            currentSuhu = lastData.suhu;
            currentKelembaban = lastData.kelembaban;
            statusKipas1 = lastData.kipas1_status;
            statusKipas2 = lastData.kipas2_status;
        }

        // B. Update status kipas yang ditargetkan
        if (target === 'fan1') {
            statusKipas1 = state; // Update Kipas 1 sesuai request (ON/OFF)
        } else if (target === 'fan2') {
            statusKipas2 = state; // Update Kipas 2 sesuai request (ON/OFF)
        }

        // C. Buat baris baru di database
        await ClimateData.create({
            deviceId: deviceId,
            suhu: currentSuhu,
            kelembaban: currentKelembaban,
            kipas1_status: statusKipas1,
            kipas2_status: statusKipas2
        });

        console.log(`[Manual Control] Status ${target} disimpan ke DB: ${state}`);

        // ============================================================

        res.status(200).json({ msg: `Perintah ${state} untuk ${target} berhasil dikirim dan disimpan.` });

    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Mengambil semua jadwal (untuk admin) atau hanya milik sendiri (untuk user)
export const getClimateSchedules = async (req, res) => {
    try {
        const options = {
            order: [['id', 'DESC']]
        };
        if (req.role !== "admin") {
            options.where = { userId: req.userId };
        }
        //: Menggunakan model ClimateSchedules
        const schedules = await ClimateSchedules.findAll(options);
        res.json(schedules);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Mengambil semua jadwal climate yang terkait dengan sebuah alat
export const getDeviceClimateSchedules = async (req, res) => {
    try {
        const device = await Devices.findByPk(req.params.deviceId);
        if (!device) return res.status(404).json({ msg: "Alat tidak ditemukan" });

        if (req.role !== "admin" && device.userId !== req.userId) {
            return res.status(403).json({ msg: "Akses ditolak" });
        }

        const deviceSchedules = await device.getClimateSchedules(); 
        // const deviceSchedules = await device.getClimateSchedules();
        res.json(deviceSchedules);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Membuat jadwal climate baru dan menautkannya ke sebuah alat
export const createClimateScheduleForDevice = async (req, res) => {
    const { deviceId } = req.params;
    //: Mengambil 'fans' dari body, bukan 'solenoid'
    const { nama, tanggalMulai, tanggalSelesai, waktu, durasi, fans } = req.body;
    try {
        const device = await Devices.findByPk(deviceId);
        if (!device) return res.status(404).json({ msg: "Alat tidak ditemukan" });

        if (req.role !== "admin" && device.userId !== req.userId) {
            return res.status(403).json({ msg: "Akses ditolak" });
        }
        if (!device.macAddress) return res.status(400).json({ msg: "Alat belum diklaim dan tidak bisa menerima jadwal." });

        //: Membuat 'ClimateSchedules' baru
        const newSchedule = await ClimateSchedules.create({ 
            nama, tanggalMulai, tanggalSelesai, waktu, durasi, 
            fans, // <-
            userId: req.userId 
        });
        
        //: Memanggil relasi 'addClimateSchedule'
        await device.addClimateSchedule(newSchedule);

        //: Menggunakan topik baru
        const topic = createClimateTopicFromMac(device.macAddress);
        if (topic) {
            const payload = { action: 'UPSERT', schedule: newSchedule.toJSON() };
            publishScheduleUpdate(topic, payload);
        }

        res.status(201).json(newSchedule);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Memperbarui sebuah jadwal climate
export const updateClimateSchedule = async (req, res) => {
    try {
        //: Mencari di 'ClimateSchedules'
        // const findOptions = { where: { id: req.params.scheduleId }, include: Devices };
        const findOptions = { 
            where: { id: req.params.scheduleId }, 
            include: { model: Devices, as: 'devices' } // Gunakan alias
        };
        if (req.role !== "admin") {
            findOptions.where.userId = req.userId;
        }

        const schedule = await ClimateSchedules.findOne(findOptions);
        if (!schedule) return res.status(404).json({ msg: "Jadwal tidak ditemukan atau Anda tidak memiliki akses." });
        
        await schedule.update(req.body);

        for (const device of schedule.devices) {
            if (device.macAddress) {
                //: Menggunakan topik baru
                const topic = createClimateTopicFromMac(device.macAddress);
                const scheduleJSON = schedule.toJSON();
                delete scheduleJSON.devices;
                const payload = { action: 'UPSERT', schedule: scheduleJSON };
                publishScheduleUpdate(topic, payload);
            }
        }
        res.status(200).json(schedule);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Menghapus sebuah jadwal climate
export const deleteClimateSchedule = async (req, res) => {
    try {
        //: Mencari di 'ClimateSchedules'
        // const findOptions = { where: { id: req.params.scheduleId }, include: Devices };
        const findOptions = { 
            where: { id: req.params.scheduleId }, 
            include: { model: Devices, as: 'devices' } // Gunakan alias
        };
        if (req.role !== "admin") {
            findOptions.where.userId = req.userId;
        }
        
        const schedule = await ClimateSchedules.findOne(findOptions);
        if (!schedule) return res.status(404).json({ msg: "Jadwal tidak ditemukan atau Anda tidak memiliki akses." });

        const scheduleIdToDelete = schedule.id;
        for (const device of schedule.devices) {
            if (device.macAddress) {
                //: Menggunakan topik baru
                const topic = createClimateTopicFromMac(device.macAddress);
                const payload = { action: 'DELETE', scheduleId: scheduleIdToDelete };
                publishScheduleUpdate(topic, payload);
            }
        }

        await schedule.destroy();
        res.status(200).json({ msg: "Jadwal berhasil dihapus" });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Fungsi ini dipanggil ketika ESP32 meminta sinkronisasi penuh
export const handleClimateSyncRequest = async (macAddress) => {
        try {
            console.log(`Menerima permintaan sinkronisasi climate dari MAC: ${macAddress}`);
            
            const device = await Devices.findOne({ where: { macAddress } });
            if (!device) {
                    console.log(`Perangkat dengan MAC ${macAddress} tidak ditemukan.`);
                    return;
            }

        // --- BAGIAN 1: SINKRONISASI JADWAL (Kode Anda yang sudah ada) ---
            const schedules = await device.getClimateSchedules({
                    order: [['id', 'ASC']]
            });
            const schedulePayload = {
                    action: "REPLACE_ALL",
                    schedules: schedules.map(s => s.toJSON()) 
            };
            const scheduleTopic = createClimateTopicFromMac(device.macAddress);
            if (scheduleTopic) {
                    publishScheduleUpdate(scheduleTopic, schedulePayload);
                    console.log(`Mengirim ${schedules.length} jadwal climate ke topik: ${scheduleTopic}`);
            }

        // --- [PERBAIKAN] BAGIAN 2: SINKRONISASI TRESHOLD (BARU) ---
        const settings = await ClimateSettings.findOne({ where: { deviceId: device.id } });
        
        if (settings) {
            // Jika treshold sudah pernah disimpan di database
            const settingsPayload = {
                        kipas1_min: settings.minSuhuKipas1,
                        kipas1_max: settings.maxSuhuKipas1,
                        kipas2_min: settings.minSuhuKipas2,
                        kipas2_max: settings.maxSuhuKipas2
                };
            
            const settingsTopic = createClimateSettingsTopicFromMac(device.macAddress);
            if (settingsTopic) {
                publishScheduleUpdate(settingsTopic, settingsPayload);
                console.log(`Mengirim treshold climate ke topik: ${settingsTopic}`);
            }
        } else {
            // Opsional: Jika belum ada setting di DB, Anda bisa kirim treshold default
            console.log(`Tidak ada treshold tersimpan untuk device ${macAddress}, ESP akan pakai default.`);
        }

    } catch (error) {
        console.error("Gagal menangani permintaan sinkronisasi climate:", error);
    }
};


export const getClimateSettings = async (req, res) => {
    try {
        // Kita ambil 'id' dari params, yang merupakan deviceId
        const { id } = req.params; 

        const settings = await ClimateSettings.findOne({
            where: { deviceId: id },
            // Kita hanya ambil 4 kolom treshold
            attributes: [
                'minSuhuKipas1', 
                'maxSuhuKipas1', 
                'minSuhuKipas2', 
                'maxSuhuKipas2'
            ]
        });

        // Jika 'settings' adalah null (belum ada data), frontend akan
        // otomatis menggunakan default state-nya. Ini sudah benar.
        res.status(200).json(settings);

    } catch (error) {
        console.error("Error getClimateSettings:", error);
        res.status(500).json({ message: "Gagal memuat pengaturan treshold." });
    }
};


export const updateClimateSettings = async (req, res) => {
    try {
        const { id } = req.params; // Ini adalah deviceId
        
        const { 
            minSuhuKipas1, 
            maxSuhuKipas1, 
            minSuhuKipas2, 
            maxSuhuKipas2 
        } = req.body;

        if (minSuhuKipas1 >= maxSuhuKipas1 || minSuhuKipas2 >= maxSuhuKipas2) {
            return res.status(400).json({ message: "Input tidak valid: Suhu MIN harus lebih rendah dari suhu MAX." });
        }

        const device = await Devices.findByPk(id);
        if (!device) {
            return res.status(404).json({ message: "Alat tidak ditemukan." });
        }
        if (!device.macAddress) {
            return res.status(400).json({ message: "Alat belum diklaim, tidak bisa mengirim pengaturan." });
        }



        if (minSuhuKipas1 >= maxSuhuKipas1 || minSuhuKipas2 >= maxSuhuKipas2) {
             return res.status(400).json({ message: "Input tidak valid: Suhu MIN harus lebih rendah dari suhu MAX." });
        }

        let settings = await ClimateSettings.findOne({ where: { deviceId: id } });

        if (settings) {
            // JIKA SUDAH ADA: Update data yang ada
            settings.minSuhuKipas1 = minSuhuKipas1;
            settings.maxSuhuKipas1 = maxSuhuKipas1;
            settings.minSuhuKipas2 = minSuhuKipas2;
            settings.maxSuhuKipas2 = maxSuhuKipas2;
            await settings.save();
        } else {
            // JIKA BELUM ADA: Buat baris data baru
            settings = await ClimateSettings.create({
                deviceId: id,
                minSuhuKipas1,
                maxSuhuKipas1,
                minSuhuKipas2,
                maxSuhuKipas2
            });
        }

        const payload = {
            kipas1_min: settings.minSuhuKipas1,
            kipas1_max: settings.maxSuhuKipas1,
            kipas2_min: settings.minSuhuKipas2,
            kipas2_max: settings.maxSuhuKipas2
        };

        // 2. Kirim event socket 'update_thresholds' ke SEMUA client (Dashboard)
        io.emit('update_thresholds', payload);
        
        // ------------------------------------

        const mqttTopic = createClimateSettingsTopicFromMac(device.macAddress);
        if (mqttTopic) {
            publishScheduleUpdate(mqttTopic, payload);
            console.log(`Mengirim treshold climate baru ke topik: ${mqttTopic}`);
        }

        // Kirim kembali data yang sudah disimpan (gunakan payload yang konsisten)
        res.status(200).json(payload);

    } catch (error) {
        console.error("Error updateClimateSettings:", error);
        res.status(500).json({ message: "Gagal menyimpan pengaturan treshold." });
    }
};

export const getClimateData = async (req, res) => {
    try {
        const { deviceId } = req.params;
        
        // 1. Verifikasi device & otorisasi (Sudah benar)
        const device = await Devices.findByPk(deviceId);
        if (!device) {
            return res.status(404).json({ msg: "Alat tidak ditemukan" });
        }
        if (req.role !== "admin" && device.userId !== req.userId) {
            return res.status(403).json({ msg: "Akses ditolak" });
        }

        // 2. Ambil query paginasi (Sudah benar)
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // 3. Gunakan findAndCountAll
        const { count, rows } = await ClimateData.findAndCountAll({
            where: { deviceId: deviceId },
            
            // --- PERBAIKAN DI SINI ---
            order: [['createdAt', 'DESC']], // <-- BENAR (camelCase 'A')
            // --- AKHIR PERBAIKAN ---

            limit: limit,
            offset: offset
        });

        // 4. Hitung total halaman (Sudah benar)
        const totalPages = Math.ceil(count / limit);

        // 5. Kirim respon (Sudah benar)
        res.status(200).json({
            data: rows,
            totalPages: totalPages,
            currentPage: page,
            totalRows: count
        });

    } catch (error) {
        // Jika masih error, ini akan menampilkannya di console backend
        console.error("Error di getClimateData:", error.message); 
        res.status(500).json({ msg: "Server Error", error: error.message });
    }
};

export const getClimateChartData = async (req, res) => {
    try {
        const { deviceId } = req.params;
        
        // 1. Verifikasi device (copy dari fungsi getClimateData)
        const device = await Devices.findByPk(deviceId);
        if (!device) {
            return res.status(404).json({ msg: "Alat tidak ditemukan" });
        }
        if (req.role !== "admin" && device.userId !== req.userId) {
            return res.status(403).json({ msg: "Akses ditolak" });
        }

        // 2. Ambil data 24 jam terakhir
        const chartData = await ClimateData.findAll({
            where: {
                deviceId: deviceId,
                createdAt: {
                    // [Op.gt] = "Greater Than" (Lebih besar dari)
                    [Op.gt]: new Date(new Date() - 24 * 60 * 60 * 1000) // 24 jam lalu
                }
            },
            // Kirim dalam urutan Terbaru dulu. 
            // Nanti di frontend (RealtimeApexChart) akan me-reverse-nya.
            order: [['createdAt', 'DESC']], 
            
            // Hanya ambil kolom yang kita butuhkan untuk chart
            attributes: ['suhu', 'kelembaban', 'createdAt'] 
        });

        res.status(200).json(chartData); // Kirim sebagai array

    } catch (error) {
        console.error("Error di getClimateChartData:", error.message);
        res.status(500).json({ msg: "Server Error", error: error.message });
    }
};

export const deleteClimateData = async (req, res) => {
    try {
        const { deviceId } = req.params;

        // 1. Verifikasi device & otorisasi (Sangat penting)
        const device = await Devices.findByPk(deviceId);
        if (!device) {
            return res.status(404).json({ msg: "Alat tidak ditemukan" });
        }
        if (req.role !== "admin" && device.userId !== req.userId) {
            return res.status(403).json({ msg: "Akses ditolak" });
        }

        // 2. Hapus semua data climate yang terkait dengan deviceId ini
        await ClimateData.destroy({
            where: {
                deviceId: deviceId
            }
        });

        // 3. Kirim respon sukses
        res.status(200).json({ msg: "Semua data historis climate untuk alat ini telah berhasil dihapus." });

    } catch (error) {
        console.error("Error di deleteClimateData:", error.message);
        res.status(500).json({ msg: "Server Error", error: error.message });
    }
};

export const getAllClimateData = async (req, res) => {
    try {
        const { deviceId } = req.params;

        // 1. Verifikasi device & otorisasi
        const device = await Devices.findByPk(deviceId);
        if (!device) {
            return res.status(404).json({ msg: "Alat tidak ditemukan" });
        }
        if (req.role !== "admin" && device.userId !== req.userId) {
            return res.status(403).json({ msg: "Akses ditolak" });
        }

        // 2. Ambil SEMUA data (tanpa limit/offset)
        const allData = await ClimateData.findAll({
            where: {
                deviceId: deviceId
            },
            order: [['createdAt', 'DESC']], // Urutkan dari terbaru
            // Kita tidak butuh semua kolom, ambil yang perlu saja
            attributes: ['createdAt', 'suhu', 'kelembaban', 'kipas1_status', 'kipas2_status']
        });

        // 3. Kirim sebagai array
        res.status(200).json(allData);

    } catch (error) {
        console.error("Error di getAllClimateData:", error.message);
        res.status(500).json({ msg: "Server Error", error: error.message });
    }
};

export const deleteFilteredClimateData = async (req, res) => {
    try {
        const { deviceId } = req.params;
        
        // Ambil jumlah hari dari body request. Default-nya 30 hari jika tidak disediakan.
        const daysToKeep = req.body.days || 30;

        // Hitung tanggal batas (cutoff date)
        const cutoffDate = new Date(new Date() - daysToKeep * 24 * 60 * 60 * 1000);

        // 1. Verifikasi device & otorisasi (Sangat penting)
        const device = await Devices.findByPk(deviceId);
        if (!device) {
            return res.status(404).json({ msg: "Alat tidak ditemukan" });
        }
        if (req.role !== "admin" && device.userId !== req.userId) {
            return res.status(403).json({ msg: "Akses ditolak" });
        }

        // 2. Hapus data yang LEBIH TUA (Less Than) dari tanggal batas
        const result = await ClimateData.destroy({
            where: {
                deviceId: deviceId,
                createdAt: {
                    [Op.lt]: cutoffDate // [Op.lt] = Less Than (lebih kecil dari / lebih tua dari)
                }
            }
        });

        // 3. Kirim respon sukses
        res.status(200).json({ 
            msg: `Berhasil menghapus ${result} baris data yang lebih tua dari ${daysToKeep} hari.` 
        });

    } catch (error) {
        console.error("Error di deleteFilteredClimateData:", error.message);
        res.status(500).json({ msg: "Server Error", error: error.message });
    }
};

export const getControlMode = async (req, res) => {
    try {
        const { deviceId } = req.params;
        
        // 1. Verifikasi device & otorisasi
        const device = await Devices.findByPk(deviceId);
        if (!device) {
            return res.status(404).json({ msg: "Alat tidak ditemukan" });
        }
        if (req.role !== "admin" && device.userId !== req.userId) {
            return res.status(403).json({ msg: "Akses ditolak" });
        }
        
        // 2. Ambil hanya mode-nya dari kolom 'controlMode'
        res.status(200).json({ mode: device.controlMode });

    } catch (error) {
        console.error("Error di getControlMode:", error.message);
        res.status(500).json({ msg: "Server Error", error: error.message });
    }
};

export const setControlMode = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { mode } = req.body; // Akan berisi "auto" atau "manual"

        // 1. Validasi input
        if (!mode || (mode !== 'auto' && mode !== 'manual')) {
            return res.status(400).json({ msg: "Mode tidak valid. Harus 'auto' atau 'manual'." });
        }

        // 2. Verifikasi device & otorisasi
        const device = await Devices.findByPk(deviceId);
        if (!device) {
            return res.status(404).json({ msg: "Alat tidak ditemukan" });
        }
        if (req.role !== "admin" && device.userId !== req.userId) {
            return res.status(403).json({ msg: "Akses ditolak" });
        }

        // 3. Update database
        await device.update({
            controlMode: mode
        });

        // 4. Kirim perintah MQTT ke ESP32
        if (device.macAddress) {
            const topic = createClimateModeTopicFromMac(device.macAddress);
            const payload = { mode: mode }; // { "mode": "auto" }
            
            publishScheduleUpdate(topic, payload); // Kirim ke MQTT
            
            // Kita log di console backend
            console.log(`[Mode Kontrol] Mode untuk ${device.macAddress} diatur ke ${mode}`);
        }

        // 5. Kirim respon sukses
        res.status(200).json({ msg: `Mode kontrol berhasil diatur ke ${mode}`, mode: mode });

    } catch (error) {
        console.error("Error di setControlMode:", error.message);
        res.status(500).json({ msg: "Server Error", error: error.message });
    }
};