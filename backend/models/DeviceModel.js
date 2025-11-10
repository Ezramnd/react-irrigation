import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import Users from "./UserModel.js"; 

const { DataTypes } = Sequelize;

const Devices = db.define('devices', {
    uuid: {
        type: DataTypes.STRING,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        validate: {
                notEmpty: true
        }
    },
    nama: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
                notEmpty: true,
                len: [3, 100]
        }
    },
    jenis: {
        type: DataTypes.ENUM('Smart Irrigation', 'Climate', "Dosing"),
        allowNull: false,
        validate: {
                notEmpty: true
        }
    },
    lokasi: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
                notEmpty: true
        }
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive', 'maintenance'),
        defaultValue: 'active',
        allowNull: false
    },
    macAddress: {
        type: DataTypes.STRING(18), // Format: "AA:BB:CC:DD:EE:FF"
        allowNull: true, 
        unique: true
    },
    userId: { // Ini adalah Foreign Key
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
                notEmpty: true
        }
    },
    ssid: {
        type: DataTypes.STRING,
        allowNull: true 
    },

    // --- [TAMBAHAN BARU] MULAI ---
    controlMode: {
        type: DataTypes.ENUM('auto', 'manual'),
        allowNull: false,
        defaultValue: 'auto'
    }
    // --- [TAMBAHAN BARU] SELESAI ---

}, {
    freezeTableName: true
});

export default Devices;