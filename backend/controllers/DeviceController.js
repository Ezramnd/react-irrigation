import Devices from "../models/DeviceModel.js";
import Schedules from "../models/ScheduleModel.js";
import Users from "../models/UserModel.js";
import ClimateSchedules from "../models/ClimateScheduleModel.js";
import { Op } from 'sequelize';

// Mengambil semua alat (untuk admin) atau hanya milik sendiri (untuk user)
export const getDevices = async (req, res) => {
    try {
        const options = {
            attributes: ['id', 'nama', 'jenis', 'lokasi', 'status', 'macAddress'],
            include: [{
                model: Users,
                attributes: ['name', 'email']
            }]
        };

        // Jika yang login bukan admin, filter berdasarkan userId
        if (req.role !== "admin") {
            options.where = { userId: req.userId };
        }

        const devices = await Devices.findAll(options);
        res.status(200).json(devices);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

// Menambahkan alat baru
export const createDevice = async (req, res) => {
    const { nama, jenis, lokasi, macAddress } = req.body;

    // Validasi input dasar
    if (!nama || !jenis || !lokasi) {
        return res.status(400).json({ msg: "Nama, Jenis, dan Lokasi wajib diisi." });
    }

    try {
        // Pembatasan MAC Address
        // Jika MAC Address diberikan, cek dulu apakah sudah terpakai
        if (macAddress) {
            const existingMac = await Devices.findOne({ where: { macAddress } });
            if (existingMac) {
                return res.status(409).json({ msg: "MAC Address ini sudah terdaftar." });
            }
        }

        const newDevice = await Devices.create({
            nama,
            jenis,
            lokasi,
            macAddress, // Bisa null jika tidak disediakan saat membuat
            status: macAddress ? 'active' : 'inactive', // Aktif jika ada MAC, jika tidak maka inaktif
            userId: req.userId
        });
        res.status(201).json({ msg: "Alat berhasil ditambahkan.", device: newDevice });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

// Memperbarui data alat
export const updateDevice = async (req, res) => {
    const { nama, jenis, lokasi, status, macAddress } = req.body;

    try {
        const findOptions = { where: { id: req.params.id } };
        // User biasa hanya bisa mengedit miliknya
        if (req.role !== 'admin') {
            findOptions.where.userId = req.userId;
        }
        
        const device = await Devices.findOne(findOptions);
        if (!device) return res.status(404).json({ msg: "Alat tidak ditemukan atau Anda tidak memiliki akses." });

        // Validasi duplikasi MAC Address saat mengubah
        if (macAddress && macAddress !== device.macAddress) {
            const existingMac = await Devices.findOne({ where: { macAddress } });
            if (existingMac) {
                return res.status(409).json({ msg: "MAC Address ini sudah digunakan oleh alat lain." });
            }
        }
        
        // Hanya update field yang relevan
        await device.update({ 
            nama, 
            jenis, 
            lokasi, 
            status,
            macAddress
        });

        res.status(200).json({ msg: "Alat berhasil diperbarui" });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Menghapus alat
export const deleteDevice = async (req, res) => {
    try {
        const findOptions = { 
            where: { id: req.params.id },
            include: Schedules // Sertakan jadwal untuk dibersihkan
        };
        // User biasa hanya bisa menghapus miliknya
        if (req.role !== 'admin') {
            findOptions.where.userId = req.userId;
        }

        const device = await Devices.findOne(findOptions);
        if (!device) return res.status(404).json({ msg: "Alat tidak ditemukan atau Anda tidak memiliki akses." });

        const associatedScheduleIds = device.schedules.map(schedule => schedule.id);
        
        await device.destroy(); // Hapus alat

        // Bersihkan jadwal yang menjadi yatim piatu atau tidak terhubung dengan alat
        if (associatedScheduleIds.length > 0) {
            for (const scheduleId of associatedScheduleIds) {
                const schedule = await Schedules.findByPk(scheduleId, { include: Devices });
                if (schedule && schedule.devices.length === 0) {
                    await schedule.destroy();
                }
            }
        }

        res.status(200).json({ msg: "Alat dan jadwal terkait berhasil dihapus" });

    } catch (error) {
        console.error("❌ Error saat menghapus alat:", error);
        res.status(500).json({ msg: error.message });
    }
};

export const getDeviceById = async (req, res) => {
    try {
        const findOptions = {
            where: { id: req.params.id },
            include: [
                { model: Users, attributes: ['name', 'email'] },
                { model: Schedules },
                // {model: ClimateSchedules}
                { 
                 model: ClimateSchedules,
                    as: 'climateSchedules' 
                } 
            ]
        };

        if (req.role !== 'admin') {
            findOptions.where.userId = req.userId;
        }

        const device = await Devices.findOne(findOptions);
        if (!device) return res.status(404).json({ msg: "Alat tidak ditemukan atau Anda tidak memiliki akses." });

        res.status(200).json(device);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

