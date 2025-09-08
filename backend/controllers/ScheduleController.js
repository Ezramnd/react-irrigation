// controllers/ScheduleController.js

import Schedules from "../models/ScheduleModel.js";
import Devices from "../models/DeviceModel.js";
import { publishScheduleUpdate } from "../mqttNotifier.js"; // <-- Impor notifier

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

// --- DIUBAH: Membuat jadwal baru DAN mengirim notifikasi ---
export const createScheduleForDevice = async (req, res) => {
    const { deviceId } = req.params;
    const { nama, tanggalMulai, tanggalSelesai, waktu, durasi, solenoid } = req.body;
    try {
        const device = await Devices.findByPk(deviceId);
        if (!device) return res.status(404).json({ msg: "Alat tidak ditemukan" });
        if (device.userId !== req.userId) return res.status(403).json({ msg: "Akses ditolak" });

        const newSchedule = await Schedules.create({
            nama, tanggalMulai, tanggalSelesai, waktu, durasi, solenoid,
            userId: req.userId
        });

        await device.addSchedule(newSchedule);

        // Kirim notifikasi "UPSERT" (Update/Insert) ke ESP32
        const topic = `esp32/alat/${deviceId}/jadwal/set`;
        const payload = { action: 'UPSERT', schedule: newSchedule.toJSON() };
        publishScheduleUpdate(topic, payload);

        res.status(201).json(newSchedule);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// controllers/ScheduleController.js

export const updateSchedule = async (req, res) => {
    try {
        const schedule = await Schedules.findOne({
            where: { id: req.params.scheduleId, userId: req.userId },
            include: Devices
        });

        if (!schedule) return res.status(404).json({ msg: "Jadwal tidak ditemukan" });
        
        await schedule.update(req.body);

        // Kirim notifikasi "UPSERT" ke SEMUA alat yang menggunakan jadwal ini
        for (const device of schedule.devices) {
            const topic = `esp32/alat/${device.id}/jadwal/set`;
            
            // Konversi ke JSON
            const scheduleJSON = schedule.toJSON();
            // Hapus field 'devices' yang tidak perlu
            delete scheduleJSON.devices; 
            
            // Gunakan variabel 'scheduleJSON' yang sudah bersih
            const payload = { action: 'UPSERT', schedule: scheduleJSON };

            publishScheduleUpdate(topic, payload);
        }

        res.status(200).json(schedule);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// --- DIUBAH: Menghapus jadwal DAN mengirim notifikasi ---
export const deleteSchedule = async (req, res) => {
    try {
        const schedule = await Schedules.findOne({
            where: { id: req.params.scheduleId, userId: req.userId },
            include: Devices
        });
        if (!schedule) return res.status(404).json({ msg: "Jadwal tidak ditemukan" });

        const scheduleIdToDelete = schedule.id;

        // Kirim notifikasi "DELETE" ke SEMUA alat yang menggunakan jadwal ini SEBELUM dihapus
        for (const device of schedule.devices) {
            const topic = `esp32/alat/${device.id}/jadwal/set`;
            const payload = { action: 'DELETE', scheduleId: scheduleIdToDelete };
            publishScheduleUpdate(topic, payload);
        }

        await schedule.destroy();
        res.status(200).json({ msg: "Jadwal berhasil dihapus" });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};