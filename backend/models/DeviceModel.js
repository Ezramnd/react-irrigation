import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import Users from "./UserModel.js"; // Import model Users

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
        defaultValue: 'inactive',
        allowNull: false
    },
    ipAddress: {
        type: DataTypes.STRING,
        allowNull: true // Boleh null awalnya, sampai perangkat mendaftar
    },
    ssid: {
        type: DataTypes.STRING,
        allowNull: true // SSID juga bisa null
    },
    macAddress: {
        type: DataTypes.STRING,
        allowNull: true, // Boleh null awalnya, sampai perangkat mendaftar
        unique: false
    },
    deviceType: {
        type: DataTypes.STRING, // Akan menyimpan "IRRIGATION", "CLIMATE", dll.
        allowNull: false // Bisa dibuat true dulu, nanti diisi otomatis oleh server
    },
    userId: { // Ini adalah Foreign Key
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    connectionType: {
        type: DataTypes.STRING,
        allowNull: true // SSID juga bisa null
    },
     controlMode: {
        type: DataTypes.ENUM('auto', 'manual'),
        allowNull: false,
        defaultValue: 'auto'
    },

    lastStatusAt: {
    type: DataTypes.DATE,
    allowNull: true
    },
    lastOfflineAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    lastOnlineAt: {
        type: DataTypes.DATE,
        allowNull: true
    },

    // Tambahkan field untuk Pompa
    pumpState: {
        type: DataTypes.ENUM('ON', 'OFF'),
        allowNull: false,
        defaultValue: 'OFF'
    },
    
    // Tambahkan field untuk setiap Solenoid
    // Sesuaikan jumlah solenoid (misal hingga solenoid6) dengan hardware Anda
    solenoid1State: {
        type: DataTypes.ENUM('ON', 'OFF'),
        allowNull: false,
        defaultValue: 'OFF'
    },
    solenoid2State: {
        type: DataTypes.ENUM('ON', 'OFF'),
        allowNull: false,
        defaultValue: 'OFF'
    },
    solenoid3State: {
        type: DataTypes.ENUM('ON', 'OFF'),
        allowNull: false,
        defaultValue: 'OFF'
    },
    solenoid4State: {
        type: DataTypes.ENUM('ON', 'OFF'),
        allowNull: false,
        defaultValue: 'OFF'
    },
    solenoid5State: {
        type: DataTypes.ENUM('ON', 'OFF'),
        allowNull: false,
        defaultValue: 'OFF'
    },
    solenoid6State: {
        type: DataTypes.ENUM('ON', 'OFF'),
        allowNull: false,
        defaultValue: 'OFF'
    },
}, {
    freezeTableName: true
});

// Mendefinisikan relasi: Setiap User memiliki banyak Device
// HAPUS DUA BARIS DI BAWAH INI
// Users.hasMany(Devices);
// Devices.belongsTo(Users, { foreignKey: 'userId' });

export default Devices;
