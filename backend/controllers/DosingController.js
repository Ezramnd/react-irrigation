import Devices from "../models/DeviceModel.js";
import DosingSettings from "../models/DosingSettingsModel.js"; 
import DosingData from "../models/DosingDataModel.js"; 
import { publishScheduleUpdate } from "../mqttNotifier.js";
import { Op } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

// Helper delay (untuk antrian MQTT agar tidak flood)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper buat topik
const createDosingTopic = (macAddress, subTopic) => {
    if (!macAddress) return null;
    let topicMac = macAddress.trim().toUpperCase().replace(/:/g, '-');
    return `esp32/alat/${topicMac}/dosing/${subTopic}`; 
}

const getRelatedDeviceIds = async (deviceId) => {
    // 1. Cari MAC Address dari ID alat yang sedang dibuka
    const currentDevice = await Devices.findByPk(deviceId, { attributes: ['macAddress'] });
    
    // Jika tidak ada MAC, kembalikan ID itu sendiri
    if (!currentDevice || !currentDevice.macAddress) return [deviceId];

    // 2. Cari semua alat lain yang punya MAC Address sama
    const relatedDevices = await Devices.findAll({
        where: { macAddress: currentDevice.macAddress },
        attributes: ['id']
    });

    // 3. Kembalikan array ID (contoh: [1, 5, 8])
    return relatedDevices.map(d => d.id);
};

// 1. AMBIL PENGATURAN
export const getDosingSettings = async (req, res) => {
    try {
        const { id } = req.params; // ID Alat dari URL
        const deviceId = id;

        const device = await Devices.findByPk(deviceId);
        if (!device) return res.status(404).json({ msg: "Alat tidak ditemukan" });
        
        if (req.role !== "admin" && device.userId !== req.userId) {
            return res.status(403).json({ msg: "Akses ditolak" });
        }

        const [settings, created] = await DosingSettings.findOrCreate({
            where: { deviceId: deviceId },
            defaults: { deviceId: deviceId } 
        });

        const frontendData = {
            targetPPM: settings.targetPPM,
            pumpDuration_sec: settings.pumpDuration,
            checkInterval_sec: settings.checkInterval ? settings.checkInterval * 60 : 0, 
            startTime_hour: settings.startTime ? parseInt(settings.startTime.split(':')[0], 10) : 8,
            endTime_hour: settings.endTime ? parseInt(settings.endTime.split(':')[0], 10) : 17,
            dailyPumpLimit: settings.dailyPumpLimit
        };

        res.status(200).json(frontendData);

    } catch (error) {
        console.error("Error getDosingSettings:", error);
        res.status(500).json({ message: "Gagal memuat pengaturan dosing." });
    }
};

// 2. UPDATE PENGATURAN
// 2. UPDATE PENGATURAN (SUDAH DIPERBAIKI)
export const updateDosingSettings = async (req, res) => {
    try {
        const { id } = req.params; 
        const deviceId = id;

        // Ambil data dari Frontend
        const {
            targetPPM, pumpDuration_sec, checkInterval_sec,
            startTime, startTime_hour, 
            endTime, endTime_hour,     
            dailyPumpLimit
        } = req.body;

        const device = await Devices.findByPk(deviceId);
        if (!device) return res.status(404).json({ msg: "Alat tidak ditemukan." });
        
        if (req.role !== "admin" && device.userId !== req.userId) {
            return res.status(403).json({ msg: "Akses ditolak" });
        }

        // --- 1. PERSIAPAN DATA DATABASE ---
        const dbData = {};
        if (targetPPM !== undefined) dbData.targetPPM = targetPPM;
        // Simpan ke DB dalam menit (sesuai logika lama Anda), tapi ingat nilai aslinya detik
        if (checkInterval_sec !== undefined) dbData.checkInterval = Math.round(checkInterval_sec / 60); 
        if (pumpDuration_sec !== undefined) dbData.pumpDuration = pumpDuration_sec;
        if (dailyPumpLimit !== undefined) dbData.dailyPumpLimit = dailyPumpLimit;
        
        // Logika Jam Mulai
        const valStart = startTime || startTime_hour;
        if (valStart !== undefined) {
            if (String(valStart).includes(':')) {
                dbData.startTime = valStart;
            } else {
                dbData.startTime = String(valStart).padStart(2, '0') + ':00:00';
            }
        }

        // Logika Jam Selesai
        const valEnd = endTime || endTime_hour;
        if (valEnd !== undefined) {
            if (String(valEnd).includes(':')) {
                dbData.endTime = valEnd;
            } else {
                dbData.endTime = String(valEnd).padStart(2, '0') + ':00:00';
            }
        }
        
        // --- 2. SIMPAN KE DATABASE ---
        const [settings, created] = await DosingSettings.findOrCreate({
            where: { deviceId: deviceId },
            defaults: { deviceId: deviceId }
        });
        await settings.update(dbData);
        
        // --- 3. PUBLISH KE MQTT (BAGIAN INI YANG KEMARIN HILANG) ---
        if (device.macAddress) {
            console.log(`[MQTT] Update Setting MAC: ${device.macAddress}`);

            // A. Kirim Target PPM
            if (targetPPM !== undefined) {
                publishScheduleUpdate(createDosingTopic(device.macAddress, "set/target_ppm"), String(targetPPM));
                await delay(200); // Beri jeda sedikit agar ESP32 tidak 'keselek'
            }

            // B. Kirim Durasi Pompa (Detik)
            if (pumpDuration_sec !== undefined) {
                publishScheduleUpdate(createDosingTopic(device.macAddress, "set/pump_duration"), String(pumpDuration_sec));
                await delay(200);
            }

            // C. Kirim Interval Cek (Detik)
            // Catatan: Pastikan ESP32 Anda mengharapkan detik. Jika menit, ganti ke (checkInterval_sec / 60)
            if (checkInterval_sec !== undefined) {
                publishScheduleUpdate(createDosingTopic(device.macAddress, "set/check_interval"), String(checkInterval_sec));
                await delay(200);
            }

            // D. Kirim Limit Harian
            if (dailyPumpLimit !== undefined) {
                publishScheduleUpdate(createDosingTopic(device.macAddress, "set/pump_limit"), String(dailyPumpLimit));
                await delay(200);
            }

            // E. Kirim Jam Mulai (Ambil jam saja, misal "8")
            if (dbData.startTime) {
                const hourOnly = parseInt(dbData.startTime.split(':')[0], 10);
                publishScheduleUpdate(createDosingTopic(device.macAddress, "set/start_time_hour"), String(hourOnly));
                await delay(200);
            }

            // F. Kirim Jam Selesai
            if (dbData.endTime) {
                const hourOnly = parseInt(dbData.endTime.split(':')[0], 10);
                publishScheduleUpdate(createDosingTopic(device.macAddress, "set/end_time_hour"), String(hourOnly));
                await delay(200);
            }
        }

        return getDosingSettings(req, res); 

    } catch (error) {
        console.error("Error updateDosingSettings:", error);
        res.status(500).json({ message: "Gagal menyimpan pengaturan dosing." });
    }
};

// 3. KONTROL MANUAL POMPA
export const manualDosingControl = async (req, res) => {
    const { id } = req.params; 
    const deviceId = id; 
    
    const { target, value } = req.body; 

    if (!target || (target !== 'pumpA' && target !== 'pumpB')) {
        return res.status(400).json({ msg: "Target harus 'pumpA' atau 'pumpB'." });
    }

    try {
        const device = await Devices.findByPk(deviceId);
        if (!device) return res.status(404).json({ msg: "Alat tidak ditemukan" });

        if (req.role !== "admin" && device.userId !== req.userId) {
            return res.status(403).json({ msg: "Akses ditolak" });
        }

        let subTopic = "";
        if (target === 'pumpA') subTopic = "set/manual_pump_a";
        if (target === 'pumpB') subTopic = "set/manual_pump_b";

        const topic = createDosingTopic(device.macAddress, subTopic);
        
        const command = String(value);

        if (topic) {
            publishScheduleUpdate(topic, command); 
            res.status(200).json({ msg: `Perintah ${target} -> ${command} dikirim.` });
        } else {
            res.status(400).json({ msg: "Alat tidak memiliki MAC Address." });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: error.message });
    }
};

// 4. AMBIL RIWAYAT DATA (TABEL)
export const getDosingData = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id) return res.status(400).json({ msg: "Device ID tidak valid." });

        const relatedIds = await getRelatedDeviceIds(id); // Pakai helper

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const { count, rows } = await DosingData.findAndCountAll({
            where: { deviceId: { [Op.in]: relatedIds } }, 
            order: [['createdAt', 'DESC']],
            limit: limit,
            offset: offset,
            attributes: ['tds_air', 'suhu_air', 'pompa_a_status', 'pompa_b_status', 'createdAt'] 
        });

        res.status(200).json({
            data: rows,
            totalRows: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        console.error("Error getDosingData:", error);
        res.status(500).json({ msg: error.message });
    }
};

// 5. AMBIL SEMUA DATA (CSV DOWNLOAD)
export const getAllDosingData = async (req, res) => {
    try {
        const { id } = req.params;

        const relatedIds = await getRelatedDeviceIds(id);

        const rows = await DosingData.findAll({
            where: { deviceId: { [Op.in]: relatedIds } },
            order: [['createdAt', 'DESC']],
            attributes: ['tds_air', 'suhu_air', 'pompa_a_status', 'pompa_b_status', 'createdAt']
        });

        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// 6. AMBIL DATA CHART
export const getDosingChartData = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) return res.status(400).json({ msg: "Device ID tidak valid." });

        const relatedIds = await getRelatedDeviceIds(id);
        
        const chartData = await DosingData.findAll({
            where: {
                deviceId: { [Op.in]: relatedIds },
                createdAt: { [Op.gt]: new Date(new Date() - 24 * 60 * 60 * 1000) } 
            },
            order: [['createdAt', 'ASC']], 
            attributes: ['tds_air', 'suhu_air', 'createdAt']
        });
        
        res.status(200).json(chartData); 
    } catch (error) {
        console.error("Error getDosingChartData:", error);
        res.status(500).json({ msg: error.message });
    }
};

// 7. HAPUS SEMUA DATA DOSING (DELETE)
export const deleteDosingData = async (req, res) => {
    try {
        const { id } = req.params;

        const relatedIds = await getRelatedDeviceIds(id);
        
        const device = await Devices.findByPk(id);
        if (!device) return res.status(404).json({ msg: "Alat tidak ditemukan" });

        await DosingData.destroy({
            where: { deviceId: { [Op.in]: relatedIds } }
        });

        res.status(200).json({ msg: "Semua riwayat dosing berhasil dihapus." });
    } catch (error) {
        console.error("Error deleteDosingData:", error);
        res.status(500).json({ msg: error.message });
    }
};

// 8. HAPUS DATA LAMA (FILTERED DELETE)
export const deleteFilteredDosingData = async (req, res) => {
    try {
        const { id } = req.params;
        const { days } = req.body; 

        const relatedIds = await getRelatedDeviceIds(id);

        if (!days) return res.status(400).json({ msg: "Parameter 'days' diperlukan." });

        const device = await Devices.findByPk(id);
        if (!device) return res.status(404).json({ msg: "Alat tidak ditemukan" });

        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - parseInt(days));

        const deletedCount = await DosingData.destroy({
            where: {
                deviceId: { [Op.in]: relatedIds },
                createdAt: {
                    [Op.lt]: dateLimit 
                }
            }
        });

        res.status(200).json({ msg: `${deletedCount} data lama berhasil dihapus.` });
    } catch (error) {
        console.error("Error deleteFilteredDosingData:", error);
        res.status(500).json({ msg: error.message });
    }
};

// --- [BARU] 9. AMBIL DATA TERAKHIR (SNAPSHOT UNTUK STATUS REALTIME) ---
export const getLatestDosingData = async (req, res) => {
    try {
        const { id } = req.params;

        const relatedIds = await getRelatedDeviceIds(id);

        // Ambil 1 data paling baru (DESC = Descending)
        const response = await DosingData.findOne({
            where: { deviceId: { [Op.in]: relatedIds } },
            order: [
                ['createdAt', 'DESC']
            ],
            attributes: ['tds_air', 'suhu_air', 'pompa_a_status', 'pompa_b_status', 'createdAt']
        });

        if (!response) {
            return res.status(200).json({
                tds_air: 0, 
                suhu_air: 0,
                msg: "Belum ada data history"
            });
        }

        res.status(200).json(response);
    } catch (error) {
        console.error("Error getLatestDosingData:", error);
        res.status(500).json({ msg: error.message });
    }
};
