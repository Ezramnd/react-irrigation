import Devices from "../models/DeviceModel.js";
import Users from "../models/UserModel.js";

export const getDevices = async (req, res) => {
    try {
        let options = {
            include: [{
                model: Users,
                attributes: ['name', 'email']
            }]
        };

        // --- LOGIKA PERAN DITERAPKAN DI SINI ---
        if (req.role === "user") {
            options.where = { userId: req.userId };
        }
        // Jika admin, 'where' akan kosong, sehingga mengambil semua data.

        const response = await Devices.findAll(options);
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

// --- FUNGSI CREATE DEVICE (DIPERBARUI) ---
// Sekarang hanya membuat "wadah" virtual untuk alat
export const createDevice = async (req, res) => {
    const { nama, jenis, lokasi } = req.body;
    try {
        const newDevice = await Devices.create({
            nama,
            jenis,
            lokasi,
            status: 'inactive', // Status awal, menunggu diklaim dengan MAC Address
            userId: req.userId
        });
        res.status(201).json({ msg: "Slot alat baru berhasil dibuat. Silakan klaim dengan MAC Address.", device: newDevice });
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
}

export const updateDevice = async (req, res) => {
    try {
        const device = await Devices.findOne({
            where: { id: req.params.id, userId: req.userId }
        });
        if (!device) return res.status(404).json({ msg: "Alat tidak ditemukan" });

        const { nama, jenis, lokasi, status, macAddress } = req.body;
        
        if (macAddress && macAddress !== device.macAddress) {
            const existingMac = await Devices.findOne({ where: { macAddress } });
            if (existingMac) {
                return res.status(409).json({ msg: "MAC Address ini sudah digunakan." });
            }
        }
        
        await device.update({ 
            nama, jenis, lokasi, 
            status: macAddress ? 'active' : device.status,
            macAddress: macAddress || device.macAddress
        });

        // TIDAK ADA LAGI PANGGILAN subscribeToDeviceStatus

        res.status(200).json({ msg: "Alat berhasil diperbarui" });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};


// --- FUNGSI BARU UNTUK DELETE ALAT ---
export const deleteDevice = async (req, res) => {
    try {
        const device = await Devices.findOne({
            where: {
                id: req.params.id, // Cari alat berdasarkan ID dari URL
                userId: req.userId  // Pastikan alat ini milik user yang sedang login
            }
        });

        if (!device) return res.status(404).json({ msg: "Alat tidak ditemukan" });

        await Devices.destroy({
            where: {
                id: device.id
            }
        });

        res.status(200).json({ msg: "Alat berhasil dihapus" });

    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}
