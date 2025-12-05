// File: models/DosingSettingsModel.js

import { Sequelize, DataTypes } from "sequelize";
import db from "../config/Database.js";

const DosingSettings = db.define('dosing_settings', {
    // Jam Operasi Otomatis
    startTime: {
        type: DataTypes.TIME, 
        allowNull: true // Boleh kosong, menunggu data dari ESP/User
    },
    endTime: {
        type: DataTypes.TIME, 
        allowNull: true
    },
    
    // Target PPM
    targetPPM: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    tolerance: {
        type: DataTypes.INTEGER, 
        allowNull: true
    },

    // Durasi Pompa (detik)
    pumpDuration: {
        type: DataTypes.INTEGER, 
        allowNull: true
    },

    // Interval Cek Ulang (menit)
    checkInterval: {
        type: DataTypes.INTEGER, 
        allowNull: true
    },

    // Limit Pompa Harian (kali)
    dailyPumpLimit: {
        type: DataTypes.INTEGER, 
        allowNull: true
    },

    // --- FOREIGN KEY (TETAP WAJIB ADA) ---
    deviceId: {
        type: DataTypes.INTEGER,
        allowNull: false, // Ini tetap wajib agar terhubung ke alat
        unique: true, 
        references: {
            model: 'devices', 
            key: 'id'
        }
    }
}, {
    freezeTableName: true,
    timestamps: false 
});

export default DosingSettings;