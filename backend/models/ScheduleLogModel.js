import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import Users from "./UserModel.js";
import Devices from "./DeviceModel.js";

const { DataTypes } = Sequelize;

const ScheduleLog = db.define('schedule_log', {
    nama: {
        type: DataTypes.STRING,
        allowNull: false
    },
    tanggal: {
        type: DataTypes.STRING,
        allowNull: false
    },
    waktu: {
        type: DataTypes.STRING,
        allowNull: false
    },
    durasi: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    solenoid: {
        type: DataTypes.STRING,
        allowNull: false
    },
    internet: {
        type: DataTypes.STRING,
        allowNull: false
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false
    },
    // Kita simpan timestamp asli dari ESP32
    timestamp: {
        type: DataTypes.DATE,
        allowNull: false
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    deviceId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    freezeTableName: true
});

// Definisikan Relasi
Users.hasMany(ScheduleLog, { foreignKey: 'userId' });
ScheduleLog.belongsTo(Users, { foreignKey: 'userId' });

Devices.hasMany(ScheduleLog, { foreignKey: 'deviceId' });
ScheduleLog.belongsTo(Devices, { foreignKey: 'deviceId' });

export default ScheduleLog;