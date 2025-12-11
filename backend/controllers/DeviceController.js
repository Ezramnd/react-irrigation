import Devices from "../models/DeviceModel.js";
import Schedules from "../models/ScheduleModel.js";
import Users from "../models/UserModel.js";
import ClimateSchedules from "../models/ClimateScheduleModel.js";
import { publishCommand } from '../mqttNotifier.js';
import { Op } from 'sequelize';

// Mengambil semua alat (untuk admin) atau hanya milik sendiri (untuk user)
export const getDevices = async (req, res) => {
    try {
        const options = {
            attributes: ['id', 'nama', 'jenis', 'lokasi', 'macAddress'],
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
    const { nama, jenis, lokasi, macAddress, deviceType} = req.body;

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
            userId: req.userId,
            deviceType // Akan diisi otomatis oleh server berdasarkan jenis perangkat
        });
        res.status(201).json({ msg: "Alat berhasil ditambahkan.", device: newDevice });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

// Memperbarui data alat
export const updateDevice = async (req, res) => {
    const { nama, jenis, lokasi, macAddress } = req.body;

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
            attributes: [
                'id', 'uuid', 'nama', 'jenis', 'lokasi', 'status', 'macAddress', 'deviceType', 'userId', 
                'connectionType', 'controlMode', 
                // TAMBAHKAN ATTRIBUTES STATUS MANUAL BARU
                'pumpState', 'solenoid1State', 'solenoid2State', 'solenoid3State', 'solenoid4State', 'solenoid5State', 'solenoid6State'
                // Sesuaikan hingga jumlah maksimum solenoid Anda
            ], 
            include: [
                { model: Users, attributes: ['name', 'email'] },
                { model: Schedules },
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

        // Jika Anda ingin mengembalikan data dengan struktur manualControl
        // Anda bisa memprosesnya di sini sebelum mengirim:
        const deviceData = device.toJSON();
        
        // Tambahkan struktur manualControl ke objek respons untuk kemudahan di React
        deviceData.manualControl = {
            pump: device.pumpState,
            solenoid1: device.solenoid1State,
            solenoid2: device.solenoid2State,
            solenoid3: device.solenoid3State,
            solenoid4: device.solenoid4State,
            solenoid5: device.solenoid5State,
            solenoid6: device.solenoid6State,
        };

        res.status(200).json(deviceData);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

export const sendManualCommand = async (req, res) => {
    const { id } = req.params; // ID Perangkat dari URL (/alat/:id/manual)
    const { solenoidId, state, target, macAddress, deviceId } = req.body; 
    
    // Validasi input dasar
    if (!id || !macAddress || !deviceId || !state || (!solenoidId && target !== 'pump')) {
        // Log ini akan muncul di terminal jika ada data yang hilang
        console.error("❌ Validasi Gagal: Payload perintah manual tidak lengkap.", req.body);
        return res.status(400).json({ msg: 'Payload perintah manual tidak lengkap atau tidak valid.' });
    }
    
    // Tambahkan error handling yang lebih baik
    try {
        const findOptions = { where: { id: id } };
        // User biasa hanya bisa mengedit miliknya
        if (req.role !== 'admin') {
            findOptions.where.userId = req.userId;
        }

        const device = await Devices.findOne(findOptions);
        
        if (!device) {
            return res.status(404).json({ msg: "Perangkat tidak ditemukan atau Anda tidak memiliki akses." });
        }
        
        // 1. Tentukan field yang akan di-update di DB dan Payload MQTT
        let dbUpdate = {}; 
        let mqttPayload = {}; 

        if (target === 'pump') {
            dbUpdate.pumpState = state; // 'ON' atau 'OFF'
            mqttPayload.pump = state;
        } else if (solenoidId) {
            const stateField = `solenoid${solenoidId}State`;

            // Pastikan field ada di model (misalnya solenoid1State)
            // Anda bisa melakukan validasi tambahan di sini:
            // if (!(stateField in device.dataValues)) {
            //     return res.status(400).json({ msg: `Solenoid ${solenoidId} tidak valid untuk perangkat ini.` });
            // }

            dbUpdate[stateField] = state; // 'ON' atau 'OFF'
            mqttPayload = {
                solenoid: solenoidId, // Nilai numerik: 1, 2, 3, dst.
                state: state          // Nilai string: 'ON' atau 'OFF'
        };
        } else {
             return res.status(400).json({ msg: 'Target kontrol manual tidak jelas.' });
        }
        
        // 2. SIMPAN STATUS BARU KE DATABASE (Persistensi)
        await device.update(dbUpdate);
        console.log(`✅ DB Update Berhasil: Device ${id} di-set ${JSON.stringify(dbUpdate)}`);

        // 3. KIRIM PERINTAH VIA MQTT KE PERANGKAT KERAS
        const published = publishCommand(macAddress, mqttPayload); 

        if (!published) {
             console.warn("⚠️ Perintah tidak dapat dikirim karena klien MQTT disconnected. Status DB sudah tersimpan.");
             // Biarkan respons 200 jika status DB sudah tersimpan
        }

        // 4. Kirim respons sukses ke Frontend
        res.status(200).json({ msg: "Perintah manual berhasil dikirim dan status disimpan.", updatedState: mqttPayload });

    } catch (error) {
        // 🔥 LOGGING KRITIS 🔥
        console.error("❌ CRITICAL ERROR IN sendManualCommand:", error.message, error.stack);
        // Kirim 500 dengan pesan error yang aman
        res.status(500).json({ msg: "Gagal memproses perintah manual di server.", error: error.message }); 
    }
};