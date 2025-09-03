import Devices from "../models/DeviceModel.js";
import Users from "../models/UserModel.js";

// Mengambil semua alat milik pengguna yang sedang login
export const getDevices = async (req, res) => {
    try {
        const response = await Devices.findAll({
            where: {
                userId: req.userId // req.userId didapat dari middleware otentikasi
            },
            include: [{
                model: Users,
                attributes: ['name', 'email'] // Sertakan info user
            }]
        });
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

// Menambahkan alat baru
export const createDevice = async (req, res) => {
    const { nama, jenis, lokasi, status } = req.body;
    try {
        const newDevice = await Devices.create({
            nama: nama,
            jenis: jenis,
            lokasi: lokasi,
            status: status,
            userId: req.userId // Tautkan alat dengan user yang sedang login
        });
        res.status(201).json({ msg: "Alat berhasil ditambahkan", device: newDevice });
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
}

// (Opsional) Tambahkan fungsi updateDevice dan deleteDevice jika diperlukan
// ...
