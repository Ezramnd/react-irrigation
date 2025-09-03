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
        const user = await Users.findAll({
            where: {
                email: req.body.email
            }
        });
        const match = await bcrypt.compare(req.body.password, user[0].password);
        if(!match) return res.status(400).json({msg: "Wrong password"});

        const userId = user[0].id;
        const name = user[0].name;
        const email = user[0].email;
        const keepLoggedIn = req.body.keepLoggedIn;

        const refreshTokenDuration = keepLoggedIn ? '7d' : '1d';
        const cookieMaxAge = keepLoggedIn 
            ? 7 * 24 * 60 * 60 * 1000  // 7 hari
            : 1 * 24 * 60 * 60 * 1000; // 1 hari

        const accessToken = jwt.sign({id: userId, email: email}, process.env.ACCESS_TOKEN_SECRET, 
            {
                expiresIn: "1h"
            });
        const refreshToken = jwt.sign({id: userId, email: email}, process.env.REFRESH_TOKEN_SECRET,
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
