import ScheduleLog from "../models/ScheduleLogModel.js";
import { Op } from "sequelize";

export const getScheduleLogs = async (req, res) => {
    try {
        const options = {
            order: [['timestamp', 'DESC']], // Tampilkan yang terbaru dulu
            limit: 200 // Batasi 100 log terbaru
        };

        // Admin bisa lihat semua, user biasa hanya miliknya
        if (req.role !== "admin") {
            options.where = { userId: req.userId };
        }

        const logs = await ScheduleLog.findAll(options);
        res.json(logs);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};