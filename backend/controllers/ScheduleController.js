import Schedules from "../models/ScheduleModel.js";
import Devices from "../models/DeviceModel.js";
import { publishScheduleUpdate } from "../mqttNotifier.js";

// Helper function untuk membuat topik MQTT dari MAC Address
const createTopicFromMac = (macAddress) => {
    if (!macAddress) return null;
    let topicMac = macAddress.replace(/:/g, '-');
    return `esp32/alat/${topicMac}/jadwal/set`;
}

// Mengambil semua jadwal (untuk admin) atau hanya milik sendiri (untuk user)
export const getSchedules = async (req, res) => {
    try {
        const options = {
            order: [['id', 'DESC']]
        };
        if (req.role !== "admin") {
            options.where = { userId: req.userId };
        }
        const schedules = await Schedules.findAll(options);
        res.json(schedules);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Mengambil semua jadwal yang terkait dengan sebuah alat
export const getDeviceSchedules = async (req, res) => {
    try {
        const device = await Devices.findByPk(req.params.deviceId);
        if (!device) return res.status(404).json({ msg: "Alat tidak ditemukan" });

        // Admin bisa lihat jadwal alat siapa pun, user biasa hanya alatnya sendiri
        if (req.role !== "admin" && device.userId !== req.userId) {
            return res.status(403).json({ msg: "Akses ditolak" });
        }

        const deviceSchedules = await device.getSchedules(); // Cara Sequelize untuk mengambil relasi
        res.json(deviceSchedules);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Membuat jadwal baru dan menautkannya ke sebuah alat
export const createScheduleForDevice = async (req, res) => {
    const { deviceId } = req.params;
    const { nama, tanggalMulai, tanggalSelesai, waktu, durasi, solenoid } = req.body;
    try {
        const device = await Devices.findByPk(deviceId);
        if (!device) return res.status(404).json({ msg: "Alat tidak ditemukan" });

        // Admin bisa menambah jadwal ke alat siapa pun, user biasa hanya ke alatnya sendiri
        if (req.role !== "admin" && device.userId !== req.userId) {
            return res.status(403).json({ msg: "Akses ditolak" });
        }
        if (!device.macAddress) return res.status(400).json({ msg: "Alat belum diklaim dan tidak bisa menerima jadwal." });

        const newSchedule = await Schedules.create({ nama, tanggalMulai, tanggalSelesai, waktu, durasi, solenoid, userId: req.userId });
        await device.addSchedule(newSchedule);

        const topic = createTopicFromMac(device.macAddress);
        if (topic) {
            const payload = { action: 'UPSERT', schedule: newSchedule.toJSON() };
            publishScheduleUpdate(topic, payload);
        }

        res.status(201).json(newSchedule);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Memperbarui sebuah jadwal
export const updateSchedule = async (req, res) => {
    try {
        const findOptions = { where: { id: req.params.scheduleId }, include: Devices };
        // User biasa hanya bisa mengedit jadwal miliknya
        if (req.role !== "admin") {
            findOptions.where.userId = req.userId;
        }

        const schedule = await Schedules.findOne(findOptions);
        if (!schedule) return res.status(404).json({ msg: "Jadwal tidak ditemukan atau Anda tidak memiliki akses." });
        
        await schedule.update(req.body);

        // Kirim notifikasi update ke semua alat yang menggunakan jadwal ini
        for (const device of schedule.devices) {
            if (device.macAddress) {
                const topic = createTopicFromMac(device.macAddress);
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

// Menghapus sebuah jadwal
export const deleteSchedule = async (req, res) => {
    try {
        const findOptions = { where: { id: req.params.scheduleId }, include: Devices };
        // User biasa hanya bisa menghapus jadwal miliknya
        if (req.role !== "admin") {
            findOptions.where.userId = req.userId;
        }
        
        const schedule = await Schedules.findOne(findOptions);
        if (!schedule) return res.status(404).json({ msg: "Jadwal tidak ditemukan atau Anda tidak memiliki akses." });

        const scheduleIdToDelete = schedule.id;
        // Kirim notifikasi hapus ke semua alat yang menggunakan jadwal ini
        for (const device of schedule.devices) {
            if (device.macAddress) {
                const topic = createTopicFromMac(device.macAddress);
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
export const handleSyncRequest = async (macAddress) => {
    try {
        console.log(`Menerima permintaan sinkronisasi dari MAC: ${macAddress}`);
        
        // 1. Cari perangkat di database berdasarkan MAC address
        const device = await Devices.findOne({ where: { macAddress } });
        if (!device) {
            console.log(`Perangkat dengan MAC ${macAddress} tidak ditemukan.`);
            return;
        }

        // 2. Ambil semua jadwal yang terhubung dengan perangkat ini
        const schedules = await device.getSchedules({
            order: [['id', 'ASC']] // Urutkan agar konsisten
        });

        // 3. Siapkan payload dengan format yang sudah kita tentukan
        const payload = {
            action: "REPLACE_ALL",
            // Ubah setiap jadwal menjadi format JSON sederhana
            schedules: schedules.map(s => s.toJSON()) 
        };

        // 4. Buat topik tujuan dan kirim kembali ke ESP32
        const topic = createTopicFromMac(device.macAddress);
        if (topic) {
            publishScheduleUpdate(topic, payload);
            console.log(`Mengirim ${schedules.length} jadwal ke topik: ${topic}`);
        }

    } catch (error) {
        console.error("Gagal menangani permintaan sinkronisasi:", error);
    }
};

// Helper function untuk membuat topik MQTT manual
const createManualTopicFromMac = (macAddress) => {
    if (!macAddress) return null;
    const topicMac = macAddress.replace(/:/g, '-');
    return `esp32/alat/${topicMac}/manual/set`;
};

export const manualControl = async (req, res) => {
    const { deviceId } = req.params;
    const { solenoidId, state } = req.body; // state akan berupa "ON" or "OFF"

    try {
        const device = await Devices.findByPk(deviceId);
        if (!device) return res.status(404).json({ msg: "Alat tidak ditemukan" });

        // Cek otorisasi (user hanya boleh mengontrol alatnya sendiri)
        if (req.role !== "admin" && device.userId !== req.userId) {
            return res.status(403).json({ msg: "Akses ditolak" });
        }

        const topic = createManualTopicFromMac(device.macAddress);
        if (topic) {
            const payload = { solenoid: solenoidId, state: state };
            publishScheduleUpdate(topic, payload); // Menggunakan kembali fungsi publish yang ada
            res.status(200).json({ msg: `Perintah ${state} terkirim ke solenoid ${solenoidId}` });
        } else {
            res.status(400).json({ msg: "Alat tidak memiliki MAC Address." });
        }

    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};