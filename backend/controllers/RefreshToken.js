import Users from "../models/UserModel.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) return res.sendStatus(401); // Tidak ada token

        // 1. Verifikasi refreshToken untuk memastikan tokennya valid dan tidak kedaluwarsa
        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
            if (err) return res.sendStatus(403); // Token tidak valid (salah secret atau kedaluwarsa)

            // 2. Cari user di database berdasarkan ID dari dalam token
            const user = await Users.findOne({
                where: {
                    id: decoded.id
                }
            });
            if (!user) return res.sendStatus(403); // User tidak ditemukan

            // 3. Pastikan refreshToken yang dikirim cocok dengan yang ada di DB
            if (refreshToken !== user.refresh_token) {
                return res.sendStatus(403);
            }

            // 4. Jika semua aman, buat accessToken BARU dengan payload yang lengkap
            const { id, name, email, role } = user;
            const accessToken = jwt.sign({ id, name, email, role }, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: "1h" // Durasinya kita samakan dengan saat Login
            });

            res.json({ accessToken });
        });
    } catch (error) {
        res.status(500).json({ msg: "Internal server error" });
    }
}