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
        type: DataTypes.STRING,
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
    userId: { // Ini adalah Foreign Key
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    }
}, {
    freezeTableName: true
});

// Mendefinisikan relasi: Setiap User memiliki banyak Device
Users.hasMany(Devices);
Devices.belongsTo(Users, { foreignKey: 'userId' });

export default Devices;
