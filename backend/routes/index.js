import express from "express";
import { getUsers, Register, Login, Logout, getMe, updateUser, deleteUser } from "../controllers/Users.js";
import { verifyToken, adminOnly } from "../middleware/AuthUser.js";
import { refreshToken } from "../controllers/RefreshToken.js";
import { getDevices, createDevice, updateDevice, deleteDevice, getDeviceById } from "../controllers/DeviceController.js";
import Devices from "../models/DeviceModel.js";
import { getDeviceSchedules, createScheduleForDevice, deleteSchedule, updateSchedule, getSchedules, manualControl} from "../controllers/ScheduleController.js";
import { 
    getDeviceClimateSchedules, 
    createClimateScheduleForDevice, 
    updateClimateSchedule, 
    deleteClimateSchedule, 
    getClimateSchedules,
    getClimateSettings,
    updateClimateSettings,
    manualClimateControl,
    getClimateData,
    getClimateChartData,
    deleteClimateData,
    deleteFilteredClimateData,
    getAllClimateData,
    getControlMode,
    setControlMode
} from "../controllers/ClimateScheduleController.js";
import { getScheduleLogs } from "../controllers/LogController.js";
import { forgotPassword, resetPassword } from "../controllers/Users.js";

const router = express.Router();

// Sinkronisasi tabel devices (jalankan sekali)
(async()=> {
    await Devices.sync();
})();

// --- Rute User ---
// Hanya admin yang bisa melihat semua user
router.get('/users', verifyToken, adminOnly, getUsers); 
// Hanya admin yang bisa membuat user baru
router.post('/users', verifyToken, adminOnly, Register); //kalo mau buat akun pake rest client, hapu verifyToken, adminOnly,
router.post('/login', Login);
router.get('/token', refreshToken);
router.delete('/logout', Logout);
router.get('/me', verifyToken, getMe);
router.patch('/users/:id', verifyToken, adminOnly, updateUser); // <-- Route UPDATE baru
router.delete('/users/:id', verifyToken, adminOnly, deleteUser); // <-- Route DELETE baru


// --- Rute Alat ---
// Logika user/admin sudah ditangani di dalam controller
router.get('/alat', verifyToken, getDevices); 
router.get('/alat/:id', verifyToken, getDeviceById);
// User biasa tetap bisa membuat, mengedit, dan menghapus alat MEREKA SENDIRI
router.post('/alat', verifyToken, createDevice);
router.patch('/alat/:id', verifyToken, updateDevice);
router.delete('/alat/:id', verifyToken, deleteDevice);

// Mengambil semua jadwal untuk satu alat spesifik
router.get('/alat/:deviceId/jadwal', verifyToken, getDeviceSchedules);
// Membuat jadwal baru untuk satu alat spesifik
router.post('/alat/:deviceId/jadwal', verifyToken, createScheduleForDevice);
// ROUTE BARU UNTUK KONTROL MANUAL
router.post('/devices/:deviceId/manual', verifyToken, manualControl);
// Menghapus jadwal (jadwal akan terhapus dari semua alat yang menggunakannya)
router.delete('/jadwal/:scheduleId', verifyToken, deleteSchedule);
router.patch('/jadwal/:scheduleId', verifyToken, updateSchedule);
router.get('/jadwal', verifyToken, getSchedules);
// Rute untuk mendapatkan log jadwal
router.get('/logs/schedule', verifyToken, getScheduleLogs);

// ==========================================
// --- RUTE CLIMATE (Tambahan Baru) ---
// ==========================================

// 1. Data & Chart (Historis)
// Menggunakan param :deviceId sesuai controller
router.get('/alat/:deviceId/climate-data', verifyToken, getClimateData);
router.get('/alat/:deviceId/climate-chart', verifyToken, getClimateChartData);
router.delete('/alat/:deviceId/climate-data', verifyToken, deleteClimateData);
router.delete('/alat/:deviceId/climate-data/filtered', verifyToken, deleteFilteredClimateData);

// 2. Kontrol Manual & Mode
router.post('/alat/:deviceId/climate-manual', verifyToken, manualClimateControl);
router.get('/alat/:deviceId/control-mode', verifyToken, getControlMode);
router.patch('/alat/:deviceId/control-mode', verifyToken, setControlMode);

// 3. Penjadwalan Climate
router.get('/alat/:deviceId/climate-jadwal', verifyToken, getDeviceClimateSchedules);
router.post('/alat/:deviceId/climate-jadwal', verifyToken, createClimateScheduleForDevice);
router.patch('/climate-jadwal/:scheduleId', verifyToken, updateClimateSchedule);
router.delete('/climate-jadwal/:scheduleId', verifyToken, deleteClimateSchedule);

// 4. Pengaturan Treshold (Suhu Min/Max)
// Perhatikan: Controller Anda menggunakan req.params.id untuk settings, jadi kita pakai :id
router.get('/alat/:id/climate-settings', verifyToken, getClimateSettings);
router.patch('/alat/:id/climate-settings', verifyToken, updateClimateSettings);

// Rute untuk lupa password dan reset password
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

export default router;