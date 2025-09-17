import Devices from "../models/DeviceModel.js";
import Schedules from "../models/ScheduleModel.js";
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


// --- FUNGSI DELETE DEVICE (DIPERBARUI DENGAN LOGIKA PEMBERSIHAN JADWAL) ---
export const deleteDevice = async (req, res) => {
    try {
        // 2. Cari alat beserta jadwal yang terhubung
        const device = await Devices.findOne({
            where: {
                id: req.params.id,
                userId: req.userId
            },
            include: Schedules // Sertakan data jadwal
        });

        if (!device) return res.status(404).json({ msg: "Alat tidak ditemukan" });

        // 3. Simpan ID dari jadwal-jadwal yang terhubung sebelum dihapus
        const associatedScheduleIds = device.schedules.map(schedule => schedule.id);

        // 4. Hapus alatnya. Relasi di tabel perantara akan otomatis terhapus oleh DB.
        await device.destroy();

        // 5. Periksa dan bersihkan jadwal yang mungkin sudah tidak terpakai
        if (associatedScheduleIds.length > 0) {
            console.log(`Memeriksa jadwal yatim piatu dari daftar ID: [${associatedScheduleIds.join(', ')}]`);
            for (const scheduleId of associatedScheduleIds) {
                const schedule = await Schedules.findByPk(scheduleId, { include: Devices });
                // Jika jadwal masih ada TAPI sudah tidak punya koneksi ke alat mana pun...
                if (schedule && schedule.devices.length === 0) {
                    console.log(`Jadwal ID #${scheduleId} sudah tidak terpakai, akan dihapus.`);
                    await schedule.destroy(); // ...maka hapus jadwal tersebut.
                }
            }
        }

        res.status(200).json({ msg: "Alat dan jadwal terkait berhasil dihapus" });

    } catch (error) {
        console.error("❌ Error saat menghapus alat:", error);
        res.status(500).json({ msg: error.message });
    }
};
