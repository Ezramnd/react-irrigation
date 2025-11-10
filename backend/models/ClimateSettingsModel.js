// File: models/ClimateSettingsModel.js

import { Sequelize } from "sequelize";
import db from "../config/Database.js";

const { DataTypes } = Sequelize;

const ClimateSettings = db.define('climate_settings', {
    // 4 Kolom Treshold kita pindahkan ke sini
    minSuhuKipas1: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 28.0
    },
    maxSuhuKipas1: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 30.0
    },
    minSuhuKipas2: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 33.0
    },
    maxSuhuKipas2: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 35.0
    },
    // Ini adalah Foreign Key yang terhubung ke tabel 'devices'
    deviceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true, // Memastikan relasi One-to-One
        references: {
            model: 'devices',
            key: 'id'
        }
    }
}, {
    freezeTableName: true,
    // Kita tidak perlu createdAt/updatedAt untuk tabel settings ini
    timestamps: false 
});

// Mendefinisikan relasi dari sisi ClimateSettings
// "Setiap ClimateSettings Milik (belongsTo) satu Device"


export default ClimateSettings;