import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import Devices from "./DeviceModel.js"; // Import model Devices untuk relasi

const { DataTypes } = Sequelize;

const DosingData = db.define('dosing_data', {
    // Ubah 'ppm' jadi 'tds_air' agar sesuai Frontend
    tds_air: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    // Ubah 'waterTemp' jadi 'suhu_air' agar sesuai Frontend
    suhu_air: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    // Tambahkan Status Pompa (PENTING untuk dashboard)
    pompa_a_status: {
        type: DataTypes.STRING,
        defaultValue: "OFF"
    },
    pompa_b_status: {
        type: DataTypes.STRING,
        defaultValue: "OFF"
    },
    // Foreign Key ke tabel devices
    deviceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'devices', // Pastikan nama tabel di database MySQL Anda 'devices'
            key: 'id'
        }
    }
}, {
    freezeTableName: true
});

// Definisikan Relasi (Opsional tapi bagus untuk query join nanti)
Devices.hasMany(DosingData);
DosingData.belongsTo(Devices, { foreignKey: 'deviceId' });

export default DosingData;