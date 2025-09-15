import express from "express";
import { getUsers, Register, Login, Logout, getMe, updateUser, deleteUser } from "../controllers/Users.js";
import { verifyToken, adminOnly } from "../middleware/AuthUser.js";
import { refreshToken } from "../controllers/RefreshToken.js";
import { getDevices, createDevice, updateDevice, deleteDevice } from "../controllers/DeviceController.js";
import Devices from "../models/DeviceModel.js";
import { getDeviceSchedules, createScheduleForDevice, deleteSchedule, updateSchedule, getSchedules} from "../controllers/ScheduleController.js";


const router = express.Router();

// Sinkronisasi tabel devices (jalankan sekali)
(async()=> {
    await Devices.sync();
})();

// --- Rute User ---
// Hanya admin yang bisa melihat semua user
router.get('/users', verifyToken, adminOnly, getUsers); 
// Hanya admin yang bisa membuat user baru
router.post('/users', verifyToken, adminOnly, Register); 
router.post('/login', Login);
router.get('/token', refreshToken);
router.delete('/logout', Logout);
router.get('/me', verifyToken, getMe);
router.patch('/users/:id', verifyToken, adminOnly, updateUser); // <-- Route UPDATE baru
router.delete('/users/:id', verifyToken, adminOnly, deleteUser); // <-- Route DELETE baru


// --- Rute Alat ---
// Logika user/admin sudah ditangani di dalam controller
router.get('/alat', verifyToken, getDevices); 
// User biasa tetap bisa membuat, mengedit, dan menghapus alat MEREKA SENDIRI
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
router.get('/jadwal', verifyToken, getSchedules);


export default router;