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

        if (req.role === "user") {
            options.where = { userId: req.userId };
        }

        const response = await Devices.findAll(options);
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

export const createDevice = async (req, res) => {
    const { nama, jenis, lokasi, macAddress } = req.body;
    if (!macAddress) {
        return res.status(400).json({ msg: "MAC Address wajib diisi." });
    }

    try {
        const existingMac = await Devices.findOne({ where: { macAddress } });
        if (existingMac) {
            return res.status(409).json({ msg: "MAC Address ini sudah terdaftar." });
        }
        const newDevice = await Devices.create({
            nama,
            jenis,
            lokasi,
            macAddress, 
            status: 'active', 
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
        
        if (macAddress && macAddress !== device.macAddress) {
            const existingMac = await Devices.findOne({ where: { macAddress } });
            if (existingMac&& existingMac.id !== device.id) {
                return res.status(409).json({ msg: "MAC Address ini sudah digunakan." });
            }
        }
        
        await device.update(req.body);

        res.status(200).json({ msg: "Alat berhasil diperbarui" });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};



export const deleteDevice = async (req, res) => {
    try {
        const device = await Devices.findOne({
            where: {
                id: req.params.id,
                userId: req.userId
            },
            include: Schedules 
        });

        if (!device) return res.status(404).json({ msg: "Alat tidak ditemukan" });

        const associatedScheduleIds = device.schedules.map(schedule => schedule.id);

        await device.destroy();

        if (associatedScheduleIds.length > 0) {
            console.log(`Memeriksa jadwal yatim piatu dari daftar ID: [${associatedScheduleIds.join(', ')}]`);
            for (const scheduleId of associatedScheduleIds) {
                const schedule = await Schedules.findByPk(scheduleId, { include: Devices });
                if (schedule && schedule.devices.length === 0) {
                    console.log(`Jadwal ID #${scheduleId} sudah tidak terpakai, akan dihapus.`);
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
