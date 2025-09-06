// controllers/ScheduleController.js
import Schedules from "../models/ScheduleModel.js";
import Devices from "../models/DeviceModel.js";

// Mengambil semua jadwal yang terkait dengan sebuah alat
export const getDeviceSchedules = async (req, res) => {
    try {
        const device = await Devices.findByPk(req.params.deviceId, {
            include: Schedules
        });
        if (!device) return res.status(404).json({ msg: "Alat tidak ditemukan" });
        // Pastikan user hanya bisa melihat jadwal alatnya sendiri
        if (device.userId !== req.userId) return res.status(403).json({ msg: "Akses ditolak" });
        
        res.json(device.schedules);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Membuat jadwal baru DAN langsung menautkannya ke sebuah alat
export const createScheduleForDevice = async (req, res) => {
    const { nama, tanggalMulai, tanggalSelesai, waktu, durasi, solenoid } = req.body;
    try {
        const device = await Devices.findByPk(req.params.deviceId);
        if (!device) return res.status(404).json({ msg: "Alat tidak ditemukan" });
        if (device.userId !== req.userId) return res.status(403).json({ msg: "Akses ditolak" });

        const newSchedule = await Schedules.create({
            nama, tanggalMulai, tanggalSelesai, waktu, durasi, solenoid,
            userId: req.userId
        });

        await device.addSchedule(newSchedule); // Tautkan jadwal baru ke alat

        res.status(201).json(newSchedule);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Menghapus jadwal
export const deleteSchedule = async (req, res) => {
    try {
        const schedule = await Schedules.findOne({
            where: { id: req.params.scheduleId, userId: req.userId }
        });
        if (!schedule) return res.status(404).json({ msg: "Jadwal tidak ditemukan" });

        await schedule.destroy();
        res.status(200).json({ msg: "Jadwal berhasil dihapus" });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

export const updateSchedule = async (req, res) => {
    try {
        // Cari jadwal berdasarkan ID dan pastikan milik user yang login
        const schedule = await Schedules.findOne({
            where: {
                id: req.params.scheduleId,
                userId: req.userId
            }
        });

        if (!schedule) {
            return res.status(404).json({ msg: "Jadwal tidak ditemukan" });
        }

        // Ambil data baru dari body request
        const { nama, tanggalMulai, tanggalSelesai, waktu, durasi, solenoid } = req.body;
        
        // Lakukan update
        await schedule.update({
            nama, tanggalMulai, tanggalSelesai, waktu, durasi, solenoid
        });

        // Kirim kembali data yang sudah diperbarui
        res.status(200).json(schedule);

    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};