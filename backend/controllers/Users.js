import { sendEmail } from '../utils/emailSender.js'; 
import Users from "../models/UserModel.js"
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { Op } from "sequelize";

export const getUsers = async(req, res) => {
     try {
        const users = await Users.findAll({
             attributes: ['id', 'name', 'email', 'role']
        });
        res.json(users);
     } catch (error) {
        console.log(error);
     }
}

export const Register = async(req, res) => {
    const { name, email, password, confPassword } = req.body;
    if(password !== confPassword) {
        return res.status(400).json({msg: "Passwords do not match"});
    }
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);
    try {
        await Users.create({ 
            name: name, 
            email: email, 
            password: hashedPassword 
        });
        res.json({msg: "User created successfully"});
    } catch (error) {
        console.log(error);
    }
}

export const Login = async(req, res) => {
    try {
       // Menggunakan findOne sudah benar, hasilnya adalah satu objek user
        const user = await Users.findOne({
            where: {
                email: req.body.email
            }
        });
       // Bandingkan password
        const match = await bcrypt.compare(req.body.password, user.password);
        if (!match) return res.status(400).json({ msg: "Password salah" });



        // --- PERBAIKAN: Akses properti langsung dari objek 'user' ---
        const userId = user.id;
        const name = user.name;
        const email = user.email;
        const role = user.role;
        // -----------------------------------------------------------
        const keepLoggedIn = req.body.keepLoggedIn;

        const refreshTokenDuration = keepLoggedIn ? '7d' : '1d';
        const cookieMaxAge = keepLoggedIn 
            ? 7 * 24 * 60 * 60 * 1000  // 7 hari
            : 1 * 24 * 60 * 60 * 1000; // 1 hari

        const accessToken = jwt.sign({id: userId, email: email, role: role}, process.env.ACCESS_TOKEN_SECRET, 
            {
                expiresIn: "1h"
            });
        const refreshToken = jwt.sign({id: userId, email: email, role: role}, process.env.REFRESH_TOKEN_SECRET,
            {
                expiresIn: refreshTokenDuration
            });
            await Users.update({refresh_token: refreshToken}, {
                where: {
                    id: userId
                }
            });
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                maxAge: cookieMaxAge, // 1 day
                // secure: true, // Aktifkan ini saat deploy ke HTTPS
                // secure: true, //tidak perlu karena masih server local
            });
            res.json({ accessToken });
    } catch (error) {
        res.status(500).json({msg: "Internal server error"});
    }
}    

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
            return res.status(200).json({ msg: "Jika email Anda terdaftar, Anda akan menerima link reset password." });
        }

        if (user.resetPasswordToken && user.resetPasswordExpires > Date.now()) {
            return res.status(429).json({ msg: "Link reset sudah dikirim. Silakan cek email Anda atau coba lagi dalam beberapa saat." });
            // Status 429 artinya "Too Many Requests"
        }

        const resetToken = crypto.randomBytes(20).toString('hex');
        
        // Simpan token dan waktu kedaluwarsa (1 jam)
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000;
        await user.save();

        const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
        const message = `Anda menerima email ini karena ada permintaan untuk me-reset password akun Agrifam Anda.\n\nSilakan klik link berikut untuk melanjutkan:\n\n${resetURL}\n\nLink ini akan kedaluwarsa dalam 1 jam.\n\nJika Anda tidak meminta ini, silakan abaikan email ini.\n`;
        
        console.log("Reset URL (untuk debugging):", resetURL); // Tetap tampilkan di konsol untuk jaga-jaga

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

        const user = await Users.findOne({
            where: {
                resetPasswordToken: resetToken,
                resetPasswordExpires: { [Op.gt]: Date.now() } 
            }
        });

        if (!user) {
            return res.status(400).json({ msg: "Token reset password tidak valid atau sudah kedaluwarsa." });
        }

        if (password !== confPassword) return res.status(400).json({ msg: "Password tidak cocok." });

        const salt = await bcrypt.genSalt();
        user.password = await bcrypt.hash(password, salt);
        
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();

        res.status(200).json({ msg: "Password berhasil diubah. Silakan login." });

    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

export const getMe = async(req, res) => {
    try {
        const user = await Users.findOne({
            where: {
                id: req.userId
            },
            attributes: ['id', 'name', 'email', 'role'] 
        });
        if (!user) return res.status(404).json({ msg: "User tidak ditemukan" });
        res.json(user);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

export const updateUser = async (req, res) => {
    const { id } = req.params;
    const { name, email, role, password } = req.body;

    try {
        const user = await Users.findOne({ where: { id: id } });
        if (!user) return res.status(404).json({ msg: "User tidak ditemukan" });

        let hashedPassword = user.password;
        if (password && password.trim() !== "") {
            const salt = await bcrypt.genSalt();
            hashedPassword = await bcrypt.hash(password, salt);
        }

        await user.update({
            name: name,
            email: email,
            role: role,
            password: hashedPassword
        });

        res.json({ msg: "User berhasil diperbarui" });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

export const deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await Users.findOne({ where: { id: id } });
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