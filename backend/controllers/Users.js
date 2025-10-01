import { sendEmail } from '../utils/emailSender.js'; 
import Users from "../models/UserModel.js"
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { Op } from "sequelize";

// Mengambil semua user (hanya untuk admin)
export const getUsers = async (req, res) => {
    try {
        const users = await Users.findAll({
            attributes: ['id', 'name', 'email', 'role']
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ msg: "Terjadi kesalahan di server." });
    }
}

// Mendaftarkan user baru (hanya untuk admin)
export const Register = async (req, res) => {
    const { name, email, password, confPassword, role } = req.body;

    if (password !== confPassword) {
        return res.status(400).json({ msg: "Password dan Konfirmasi Password tidak cocok." });
    }
    
    try {
        // Cek apakah email sudah terdaftar
        const existingUser = await Users.findOne({ where: { email: email } });
        if (existingUser) {
            return res.status(409).json({ msg: "Email sudah terdaftar." });
        }

        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password, salt);

        await Users.create({
            name: name,
            email: email,
            password: hashedPassword,
            role: role || 'user' // Default ke 'user' jika tidak disediakan
        });
        res.status(201).json({ msg: "User berhasil dibuat." });
    } catch (error) {
        res.status(500).json({ msg: "Terjadi kesalahan saat membuat user." });
    }
}

// Login user
export const Login = async (req, res) => {
    try {
        const user = await Users.findOne({ where: { email: req.body.email } });
        if (!user) return res.status(404).json({ msg: "Email tidak ditemukan." });

        const match = await bcrypt.compare(req.body.password, user.password);
        if (!match) return res.status(400).json({ msg: "Password salah." });

        const { id, name, email, role } = user;
        const keepLoggedIn = req.body.keepLoggedIn;

        // Buat payload yang konsisten untuk kedua token
        const tokenPayload = { id, name, email, role };

        const accessToken = jwt.sign(tokenPayload, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: "1h"
        });
        const refreshToken = jwt.sign(tokenPayload, process.env.REFRESH_TOKEN_SECRET, {
            expiresIn: keepLoggedIn ? '7d' : '1d'
        });
            
        await user.update({ refresh_token: refreshToken });
        
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            maxAge: (keepLoggedIn ? 7 : 1) * 24 * 60 * 60 * 1000,
            secure: process.env.NODE_ENV === 'production', // Hanya secure di produksi
            sameSite: 'strict'
        });

        res.json({ accessToken });
    } catch (error) {
        res.status(500).json({ msg: "Terjadi kesalahan di server." });
    }
}  

// Logout user
export const Logout = async(req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) return res.sendStatus(204);

        // Gunakan findOne untuk efisiensi
        const user = await Users.findOne({
            where: {
                refresh_token: refreshToken
            }
        });

        // Jika user dengan token itu tidak ada, cukup kirim status sukses (204)
        if (!user) return res.sendStatus(204);

        // Update refresh_token menjadi null
        await Users.update({ refresh_token: null }, {
            where: {
                id: user.id
            }
        });

        res.clearCookie('refreshToken');
        return res.sendStatus(200);

    } catch (error) {
        console.error("Terjadi error saat logout:", error);
        return res.status(500).json({ msg: "Internal Server Error" });
    }
}

export const forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await Users.findOne({ where: { email: email } });
        if (!user) {
            // Tetap kirim respons sukses untuk keamanan, agar orang tidak bisa menebak email terdaftar
            return res.status(200).json({ msg: "Jika email Anda terdaftar, Anda akan menerima link reset password." });
        }
         if (user.resetPasswordToken && user.resetPasswordExpires > Date.now()) {
            return res.status(429).json({ msg: "Link reset sudah dikirim. Silakan cek email Anda atau coba lagi dalam beberapa saat." });
            // Status 429 artinya "Too Many Requests"
        }

        // Buat token reset
        const resetToken = crypto.randomBytes(20).toString('hex');

        // Simpan token dan waktu kedaluwarsa (1 jam)
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000;
        await user.save();

        // Siapkan URL dan pesan email
        const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
        const message = `Anda menerima email ini karena ada permintaan untuk me-reset password akun Agrifam Anda.\n\nSilakan klik link berikut untuk melanjutkan:\n\n${resetURL}\n\nLink ini akan kedaluwarsa dalam 1 jam.\n\nJika Anda tidak meminta ini, silakan abaikan email ini.\n`;

        console.log("Reset URL (untuk debugging):", resetURL); // Tetap tampilkan di konsol untuk jaga-jaga

        // --- INI ADALAH BAGIAN YANG HILANG ---
        // Panggil fungsi sendEmail yang sudah kita buat
        await sendEmail({
            email: user.email,
            subject: 'Link Reset Password Akun Agrifam',
            message: message
        });
        // ------------------------------------

        res.status(200).json({ msg: "Email reset password telah dikirim." });

    } catch (error) {
        console.error('Error di forgotPassword:', error);
        res.status(500).json({ msg: "Terjadi kesalahan di server." });
    }
};


export const resetPassword = async (req, res) => {
    try {
        const resetToken = req.params.token;
        const { password, confPassword } = req.body;

        // Cari user dengan token yang valid dan belum kedaluwarsa
        const user = await Users.findOne({
            where: {
                resetPasswordToken: resetToken,
                resetPasswordExpires: { [Op.gt]: Date.now() } // Op.gt = Greater Than
            }
        });

        if (!user) {
            return res.status(400).json({ msg: "Token reset password tidak valid atau sudah kedaluwarsa." });
        }

        if (password !== confPassword) return res.status(400).json({ msg: "Password tidak cocok." });

        // Hash password baru dan simpan
        const salt = await bcrypt.genSalt();
        user.password = await bcrypt.hash(password, salt);

        // Hapus token setelah digunakan
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();

        res.status(200).json({ msg: "Password berhasil diubah. Silakan login." });

    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};
// Mengambil data user yang sedang login
export const getMe = async (req, res) => {
    // Fungsi ini tidak perlu query DB, karena verifyToken sudah menyediakan datanya.
    // Tapi jika ingin data paling fresh, ini sudah benar.
    // Untuk efisiensi, kita bisa ambil dari token saja, namun ini lebih aman.
    try {
        const user = await Users.findByPk(req.userId, {
            attributes: ['id', 'name', 'email', 'role']
        });
        if (!user) return res.status(404).json({ msg: "User tidak ditemukan" });
        res.json(user);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

// Memperbarui data user (hanya untuk admin)
export const updateUser = async (req, res) => {
    const { name, email, role, password } = req.body;
    try {
        const user = await Users.findByPk(req.params.id);
        if (!user) return res.status(404).json({ msg: "User tidak ditemukan" });

        // Cek duplikasi email jika email diubah
        if (email && email !== user.email) {
            const existingUser = await Users.findOne({ where: { email: email } });
            if (existingUser) return res.status(409).json({ msg: "Email sudah digunakan." });
        }

        let hashedPassword = user.password;
        if (password && password.trim() !== "") {
            const salt = await bcrypt.genSalt();
            hashedPassword = await bcrypt.hash(password, salt);
        }

        await user.update({ name, email, role, password: hashedPassword });
        res.json({ msg: "User berhasil diperbarui" });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

// Menghapus user (hanya untuk admin)
export const deleteUser = async (req, res) => {
    try {
        const user = await Users.findByPk(req.params.id);
        if (!user) return res.status(404).json({ msg: "User tidak ditemukan" });

        if (req.userId === user.id) {
            return res.status(403).json({ msg: "Admin tidak bisa menghapus akunnya sendiri." });
        }

        await user.destroy();
        res.json({ msg: "User berhasil dihapus" });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}