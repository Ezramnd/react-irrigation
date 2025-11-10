// models/ClimateScheduleModel.js
import { Sequelize, DataTypes } from "sequelize";
import db from "../config/Database.js";

const ClimateSchedules = db.define('climate_schedules', {
    // Kita tetap gunakan 'nama' untuk label (cth: "Pendinginan Siang")
    nama: {
        type: DataTypes.STRING,
        allowNull: true
    },
    // Kapan jadwal ini mulai berlaku
    tanggalMulai: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    // Kapan jadwal ini berakhir
    tanggalSelesai: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    // Jam berapa saja kipas akan menyala (cth: ["08:00", "14:00"])
    waktu: { 
        type: DataTypes.JSON,
        allowNull: false
    },
    // Berapa lama kipas menyala dalam satuan menit
    durasi: { 
        type: DataTypes.INTEGER,
        allowNull: false
    },
    // Kipas mana yang akan menyala (cth: [1, 2] atau [1] atau [2])
    fans: { 
        type: DataTypes.JSON,
        allowNull: false
    },
    // ID pengguna yang memiliki jadwal ini (untuk keamanan)
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    freezeTableName: true
});

export default ClimateSchedules;