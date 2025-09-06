// models/ScheduleModel.js
import { Sequelize, DataTypes } from "sequelize";
import db from "../config/Database.js";

const Schedules = db.define('schedules', {
    nama: {
        type: DataTypes.STRING,
        allowNull: true
    },
    tanggalMulai: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    tanggalSelesai: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    waktu: { // cth: ["08:00", "16:00"]
        type: DataTypes.JSON,
        allowNull: false
    },
    durasi: { // dalam menit
        type: DataTypes.INTEGER,
        allowNull: false
    },
    solenoid: { // cth: [1, 3, 5]
        type: DataTypes.JSON,
        allowNull: false
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    freezeTableName: true
});

export default Schedules;