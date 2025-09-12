import jwt from "jsonwebtoken";
import Users from "../models/UserModel.js";

// Middleware untuk memverifikasi token dan mengambil data user dari payload-nya
export const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401); // Unauthorized

    // Verifikasi accessToken menggunakan secret key
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) return res.sendStatus(403); // Forbidden (token tidak valid/kedaluwarsa)
        
        // Ambil payload dari token yang sudah valid
        req.userId = decoded.id;
        req.role = decoded.role; // <-- Kita dapatkan role langsung dari token
        next();
    });
}

// Middleware untuk memastikan hanya admin yang bisa lanjut
export const adminOnly = (req, res, next) => {
    // Middleware ini berasumsi verifyToken sudah berjalan sebelumnya dan menyediakan req.role
    if (req.role !== "admin") {
        return res.status(403).json({ msg: "Akses Ditolak: Hanya untuk Admin" });
    }
    next();
}