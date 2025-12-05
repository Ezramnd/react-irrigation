import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import Devices from "./DeviceModel.js"; 

const { DataTypes } = Sequelize;

const ClimateData = db.define('climate_data', {
    suhu: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true
    },
    kelembaban: {
        type: DataTypes.DECIMAL(5, 2), 
        allowNull: true
    },
    kipas1_status: {
        type: DataTypes.STRING(10), // Akan menyimpan "ON" atau "OFF"
        allowNull: true
    },
    kipas2_status: {
        type: DataTypes.STRING(10), // Akan menyimpan "ON" atau "OFF"
        allowNull: true
    }
}, {
    freezeTableName: true
});

Devices.hasMany(ClimateData, { 
    foreignKey: 'deviceId',
    onDelete: 'CASCADE'
});
ClimateData.belongsTo(Devices, { foreignKey: 'deviceId' });

export default ClimateData; // Ekspor model yang baru