import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const db = new Sequelize(
    process.env.DB_NAME,    // Mengambil nama database dari .env
    process.env.DB_USER,    // Mengambil user dari .env
    process.env.DB_PASS,    // Mengambil password dari .env
    {
        host: process.env.DB_HOST, // Mengambil host dari .env
        dialect: 'mysql',
        // Opsional: Matikan logging query SQL di konsol agar lebih bersih
        // logging: false 
    }
);

export default db;