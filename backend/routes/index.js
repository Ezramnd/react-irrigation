import express from "express";
import { getUsers,Register, Login, Logout } from "../controllers/Users.js";
import { verifyToken } from "../middleware/VerifyToken.js"; 
import { refreshToken } from "../controllers/RefreshToken.js";
import { getDevices, createDevice, updateDevice, deleteDevice } from "../controllers/DeviceController.js";
import Devices from "../models/DeviceModel.js"; // Import model untuk sinkronisasi
import { getDeviceSchedules, createScheduleForDevice, deleteSchedule, updateSchedule } from "../controllers/ScheduleController.js";


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

// Mengambil semua jadwal untuk satu alat spesifik
router.get('/alat/:deviceId/jadwal', verifyToken, getDeviceSchedules);
// Membuat jadwal baru untuk satu alat spesifik
router.post('/alat/:deviceId/jadwal', verifyToken, createScheduleForDevice);
// Menghapus jadwal (jadwal akan terhapus dari semua alat yang menggunakannya)
router.delete('/jadwal/:scheduleId', verifyToken, deleteSchedule);
router.patch('/jadwal/:scheduleId', verifyToken, updateSchedule);

export default router;