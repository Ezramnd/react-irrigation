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
    // 1. Ambil SEMUA field yang dibutuhkan, termasuk macAddress
    const { nama, jenis, lokasi, macAddress } = req.body;

    // 2. Validasi: pastikan macAddress dikirim oleh frontend
    if (!macAddress) {
        return res.status(400).json({ msg: "MAC Address wajib diisi." });
    }

    try {
        // 3. Cek apakah MAC Address sudah terdaftar untuk mencegah duplikat
        const existingMac = await Devices.findOne({ where: { macAddress } });
        if (existingMac) {
            return res.status(409).json({ msg: "MAC Address ini sudah terdaftar." });
        }

        // 4. Buat device baru dengan menyertakan macAddress
        const newDevice = await Devices.create({
            nama,
            jenis,
            lokasi,
            macAddress, // <-- Tambahkan macAddress di sini
            status: 'active', // Langsung aktif karena sudah dipasangkan
            userId: req.userId
        });

        res.status(201).json({ msg: "Alat baru berhasil ditambahkan dan dipasangkan.", device: newDevice });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

export const updateDevice = async (req, res) => {
    try {
        const device = await Devices.findOne({
            where: { id: req.params.id, userId: req.userId }
        });
        if (!device) return res.status(404).json({ msg: "Alat tidak ditemukan" });

             const { macAddress } = req.body;
        // const { nama, jenis, lokasi, status, macAddress } = req.body;
        
        if (macAddress && macAddress !== device.macAddress) {
            const existingMac = await Devices.findOne({ where: { macAddress } });
            if (existingMac&& existingMac.id !== device.id) {
                return res.status(409).json({ msg: "MAC Address ini sudah digunakan." });
            }
        }
        
           // await device.update({ 
        //     nama, jenis, lokasi, 
        //     status: macAddress ? 'active' : device.status,
        //     macAddress: macAddress || device.macAddress
        // });
        await device.update(req.body);
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
