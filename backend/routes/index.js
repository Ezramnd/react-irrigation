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
import ClimateSettings from "../models/ClimateSettingsModel.js";
import { getScheduleLogs } from "../controllers/LogController.js";
import { forgotPassword, resetPassword } from "../controllers/Users.js";
import db from "../config/Database.js";
import Users from "../models/UserModel.js";

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
// Rute untuk lupa password dan reset password
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// --- Rute Climate dan Jadwal Climate ---
router.get('/alat/:id/climate-settings', verifyToken, getClimateSettings);
router.patch('/alat/:id/climate-settings', verifyToken, updateClimateSettings);

// GET /alat/:deviceId/climate-jadwal
router.get('/alat/:deviceId/climate-jadwal', verifyToken, getDeviceClimateSchedules);

// POST /alat/:deviceId/climate-jadwal
router.post('/alat/:deviceId/climate-jadwal', verifyToken, createClimateScheduleForDevice);

// PATCH /climate-jadwal/:scheduleId
router.patch('/climate-jadwal/:scheduleId', verifyToken, updateClimateSchedule);

// DELETE /climate-jadwal/:scheduleId
router.delete('/climate-jadwal/:scheduleId', verifyToken, deleteClimateSchedule);

// (Opsional) Rute admin untuk melihat semua jadwal climate
router.get('/climate-jadwal', verifyToken, adminOnly, getClimateSchedules);

router.get('/alat/:deviceId/climate-data', verifyToken, getClimateData);

router.get('/alat/:deviceId/climate-chart', verifyToken, getClimateChartData);

router.delete('/alat/:deviceId/climate-data', verifyToken, deleteClimateData);

router.delete('/alat/:deviceId/climate-data/filtered', verifyToken, deleteFilteredClimateData);

router.get('/alat/:deviceId/climate-data/all', verifyToken, getAllClimateData);

router.post('/alat/:deviceId/climate-manual', verifyToken, manualClimateControl);

router.get('/alat/:deviceId/control-mode', verifyToken, getControlMode);
router.patch('/alat/:deviceId/control-mode', verifyToken, setControlMode);

Users.hasMany(Devices);
Devices.belongsTo(Users, { foreignKey: 'userId' });

// Relasi Device <-> ClimateSettings (One-to-One)
Devices.hasOne(ClimateSettings, { foreignKey: 'deviceId' });
ClimateSettings.belongsTo(Devices, { 
    foreignKey: 'deviceId',
    onDelete: 'CASCADE' 
});

export default router;