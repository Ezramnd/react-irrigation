import Devices from "../models/DeviceModel.js";
import Users from "../models/UserModel.js";

// --- FUNGSI GET DEVICES (Tidak Berubah) ---
export const getDevices = async (req, res) => {
    try {
        const response = await Devices.findAll({
            where: { userId: req.userId },
            include: [{ model: Users, attributes: ['name', 'email'] }]
        });
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

// --- FUNGSI UPDATE DEVICE (DENGAN LOGGING DETAIL) ---
export const updateDevice = async (req, res) => {
    console.log("--- Memulai proses update alat ---");
    try {
        const device = await Devices.findOne({
            where: {
                id: req.params.id,
                userId: req.userId
            }
        });

        if (!device) {
            console.log("DEBUG: Alat tidak ditemukan atau bukan milik user. Mengirim 404.");
            return res.status(404).json({ msg: "Alat tidak ditemukan" });
        }
        
        console.log("DEBUG: Alat ditemukan:", device.toJSON());
        console.log("DEBUG: Data yang diterima dari frontend (req.body):", req.body);

        const { nama, jenis, lokasi, status, macAddress } = req.body;
        
        // Cek jika ada MAC address yang dikirim
        if (macAddress && macAddress !== device.macAddress) {
            console.log(`DEBUG: Memvalidasi MAC Address baru: ${macAddress}`);
            const existingMac = await Devices.findOne({ where: { macAddress: macAddress } });

            if (existingMac) {
                console.log("DEBUG: MAC Address sudah digunakan. Mengirim 409.");
                return res.status(409).json({ msg: "MAC Address ini sudah digunakan oleh alat lain." });
            }
            console.log("DEBUG: MAC Address tersedia.");
        }
        
        console.log("DEBUG: Melakukan proses update ke database...");
        await device.update({ 
            nama, 
            jenis, 
            lokasi, 
            status: macAddress ? 'active' : device.status,
            macAddress: macAddress || device.macAddress
        });
        console.log("DEBUG: Update ke database berhasil.");

        res.status(200).json({ msg: "Alat berhasil diperbarui" });

    } catch (error) {
        console.error("❌ Terjadi error di dalam updateDevice:", error);
        res.status(500).json({ msg: error.message });
    }
}

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
