import express from "express";
import { getUsers,Register, Login, Logout } from "../controllers/Users.js";
import { verifyToken } from "../middleware/VerifyToken.js"; 
import { refreshToken } from "../controllers/RefreshToken.js";
import { getDevices, createDevice, updateDevice, deleteDevice } from "../controllers/DeviceController.js";
import Devices from "../models/DeviceModel.js"; // Import model untuk sinkronisasi


const router = express.Router();

// Sinkronisasi tabel devices (jalankan sekali)
(async()=> {
    await Devices.sync();
})();

router.get('/users', verifyToken, getUsers);
router.post('/users', Register);
router.post('/login', Login);
router.get('/token', refreshToken);
router.delete('/logout', Logout);

// --- RUTE BARU UNTUK ALAT ---
// Pastikan verifyToken digunakan untuk melindungi rute ini
router.get('/alat', verifyToken, getDevices);
router.post('/alat', verifyToken, createDevice);
router.patch('/alat/:id', verifyToken, updateDevice);
router.delete('/alat/:id', verifyToken, deleteDevice);

export default router;