// controllers/ScheduleController.js

import Schedules from "../models/ScheduleModel.js";
import Devices from "../models/DeviceModel.js";
import { publishScheduleUpdate } from "../mqttNotifier.js"; // <-- Impor notifier

// Helper function untuk membuat topik dari MAC Address
const createTopicFromMac = (macAddress) => {
    if (!macAddress) return null;
    let topicMac = macAddress.replace(/:/g, '-'); // Ganti ':' dengan '-'
    return `esp32/alat/${topicMac}/jadwal/set`;
}

// --- TAMBAHKAN FUNGSI BARU INI ---
export const getSchedules = async (req, res) => {
    try {
        let options = {
            order: [['id', 'DESC']] // Urutkan dari yang terbaru
        };

        // Jika bukan admin, filter berdasarkan userId
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
        const device = await Devices.findByPk(req.params.deviceId, {
            include: Schedules
        });
        if (!device) return res.status(404).json({ msg: "Alat tidak ditemukan" });
        if (device.userId !== req.userId) return res.status(403).json({ msg: "Akses ditolak" });
        
        res.json(device.schedules);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// --- DIUBAH: Sekarang menggunakan MAC Address untuk topik MQTT ---
export const createScheduleForDevice = async (req, res) => {
    const { deviceId } = req.params;
    const { nama, tanggalMulai, tanggalSelesai, waktu, durasi, solenoid } = req.body;
    try {
        const device = await Devices.findByPk(deviceId);
        if (!device || !device.macAddress) return res.status(404).json({ msg: "Alat tidak ditemukan atau belum diklaim" });
        if (device.userId !== req.userId) return res.status(403).json({ msg: "Akses ditolak" });

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

// --- DIUBAH: Sekarang menggunakan MAC Address untuk topik MQTT ---
export const updateSchedule = async (req, res) => {
    try {
        const schedule = await Schedules.findOne({
            where: { id: req.params.scheduleId, userId: req.userId },
            include: Devices
        });
        if (!schedule) return res.status(404).json({ msg: "Jadwal tidak ditemukan" });
        await schedule.update(req.body);

        for (const device of schedule.devices) {
            if (device.macAddress) { // Hanya kirim ke perangkat yang sudah diklaim
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


// --- DIUBAH: Sekarang menggunakan MAC Address untuk topik MQTT ---
export const deleteSchedule = async (req, res) => {
    try {
        const schedule = await Schedules.findOne({
            where: { id: req.params.scheduleId, userId: req.userId },
            include: Devices
        });
        if (!schedule) return res.status(404).json({ msg: "Jadwal tidak ditemukan" });

        const scheduleIdToDelete = schedule.id;
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
