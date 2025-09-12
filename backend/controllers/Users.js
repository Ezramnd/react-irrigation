import Users from "../models/UserModel.js"
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const getUsers = async(req, res) => {
     try {
        const users = await Users.findAll({
            attributes:['id','name','email']
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
    const refreshToken = req.cookies.refreshToken;
    if(!refreshToken) return res.sendStatus(204);
    const user = await Users.findAll({
        where: {
            refresh_token: refreshToken
        }
    });
    if(!user[0]) return res.sendStatus(204);
    const userId = user[0].id;
    await Users.update({refresh_token: null}, {
        where: {
            id: user[0].id
        }
    });
    res.clearCookie('refreshToken');
    res.sendStatus(200);
}

// --- TAMBAHKAN FUNGSI BARU INI ---
export const getMe = async(req, res) => {
    try {
        // req.userId didapat dari middleware verifyToken
        const user = await Users.findOne({
            where: {
                id: req.userId
            },
            attributes: ['id', 'name', 'email', 'role'] // Ambil atribut yang dibutuhkan
        });
        if (!user) return res.status(404).json({ msg: "User tidak ditemukan" });
        res.json(user);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

// --- TAMBAHKAN FUNGSI BARU UNTUK UPDATE USER ---
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

// --- TAMBAHKAN FUNGSI BARU UNTUK DELETE USER ---
export const deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await Users.findOne({ where: { id: id } });
        if (!user) return res.status(404).json({ msg: "User tidak ditemukan" });

        // Tambahan: Mencegah admin menghapus akunnya sendiri
        if (req.userId === user.id) {
            return res.status(403).json({ msg: "Admin tidak bisa menghapus akunnya sendiri." });
        }

        await user.destroy();
        res.json({ msg: "User berhasil dihapus" });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}