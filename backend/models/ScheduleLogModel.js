import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import Users from "./UserModel.js";
import Devices from "./DeviceModel.js";

const { DataTypes } = Sequelize;

const ScheduleLog = db.define('schedule_log', {
    executionId: {
        type: DataTypes.STRING,
        allowNull: false
    },
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
    reason: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "OK"
    },
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
    freezeTableName: true,
    indexes: [
        {
            unique: true,
            fields: ['executionId', 'deviceId']
        }
    ]
});

Users.hasMany(ScheduleLog, { foreignKey: 'userId' });
ScheduleLog.belongsTo(Users, { foreignKey: 'userId' });

Devices.hasMany(ScheduleLog, { foreignKey: 'deviceId' });
ScheduleLog.belongsTo(Devices, { foreignKey: 'deviceId' });

export default ScheduleLog;