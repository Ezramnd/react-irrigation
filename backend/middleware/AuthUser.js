import jwt from "jsonwebtoken";
import Users from "../models/UserModel.js";
import dotenv from "dotenv";

dotenv.config();

/**
 * Middleware untuk memverifikasi accessToken.
 * - Cepat karena hanya memverifikasi signature token.
 * - Mengambil userId dan role dari payload token untuk digunakan di request selanjutnya.
 */
export const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401); // Unauthorized

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            // Jika token tidak valid (misalnya kedaluwarsa atau salah), kirim Forbidden
            return res.sendStatus(403); 
        }
        
        // Simpan informasi dari token ke dalam objek request
        req.userId = decoded.id;
        req.role = decoded.role;
        next(); // Lanjutkan ke middleware atau controller berikutnya
    });
}

/**
 * Middleware untuk memastikan hanya user dengan peran 'admin' yang bisa melanjutkan.
 * - Wajib dijalankan SETELAH verifyToken.
 * - Melakukan satu pengecekan cepat ke database untuk memastikan user masih ada.
 */
export const adminOnly = async (req, res, next) => {
    // Cek dulu apakah peran dari token adalah admin
    if (req.role !== "admin") {
        return res.status(403).json({ msg: "Akses Ditolak: Hanya untuk Admin" });
    }

    try {
        // Sebagai lapisan keamanan tambahan, pastikan user tersebut benar-benar ada di database
        const adminUser = await Users.findByPk(req.userId);
        if (!adminUser) {
            return res.status(404).json({ msg: "Akun admin tidak ditemukan." });
        }
        
        // Jika user ada dan perannya admin, izinkan lanjut
        next();
    } catch (error) {
        res.status(500).json({ msg: "Terjadi kesalahan di server." });
    }
}