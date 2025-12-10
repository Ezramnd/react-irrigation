import express from "express";
import { getUsers, Register, Login, Logout, getMe, updateUser, deleteUser, forgotPassword, resetPassword } from "../controllers/Users.js";
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

// Impor Dosing Controller
import {
    getDosingSettings,
    updateDosingSettings,
    manualDosingControl,
    getDosingData,
    getLatestDosingData,
    getDosingChartData,
    getAllDosingData,
    deleteDosingData,          
    deleteFilteredDosingData 
} from "../controllers/DosingController.js";

import ClimateSettings from "../models/ClimateSettingsModel.js";
import DosingSettings from "../models/DosingSettingsModel.js";
import DosingData from "../models/DosingDataModel.js";

import db from "../config/Database.js";
import Users from "../models/UserModel.js";

const router = express.Router();

// Sinkronisasi tabel devices (jalankan sekali)
(async()=> {
    await Devices.sync();
    // await ClimateSettings.sync();
    // await DosingSettings.sync();
    // await DosingData.sync();
})();

// --- Rute User ---
router.get('/users', verifyToken, adminOnly, getUsers); 
router.post('/users', verifyToken, adminOnly, Register);
router.post('/login', Login);
router.get('/token', refreshToken);
router.delete('/logout', Logout);
router.get('/me', verifyToken, getMe);
router.patch('/users/:id', verifyToken, adminOnly, updateUser); 
router.delete('/users/:id', verifyToken, adminOnly, deleteUser); 


// --- Rute Alat ---
router.get('/alat', verifyToken, getDevices); 
router.get('/alat/:id', verifyToken, getDeviceById);
router.post('/alat', verifyToken, createDevice);
router.patch('/alat/:id', verifyToken, updateDevice);
router.delete('/alat/:id', verifyToken, deleteDevice);

// --- Rute Jadwal Irigasi ---
router.get('/alat/:deviceId/jadwal', verifyToken, getDeviceSchedules);
router.post('/alat/:deviceId/jadwal', verifyToken, createScheduleForDevice);
router.post('/devices/:deviceId/manual', verifyToken, manualControl);
router.delete('/jadwal/:scheduleId', verifyToken, deleteSchedule);
router.patch('/jadwal/:scheduleId', verifyToken, updateSchedule);
router.get('/jadwal', verifyToken, getSchedules);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// --- Rute Climate ---
router.get('/alat/:id/climate-settings', verifyToken, getClimateSettings);
router.patch('/alat/:id/climate-settings', verifyToken, updateClimateSettings);
router.get('/alat/:deviceId/climate-jadwal', verifyToken, getDeviceClimateSchedules);
router.post('/alat/:deviceId/climate-jadwal', verifyToken, createClimateScheduleForDevice);
router.patch('/climate-jadwal/:scheduleId', verifyToken, updateClimateSchedule);
router.delete('/climate-jadwal/:scheduleId', verifyToken, deleteClimateSchedule);
router.get('/climate-jadwal', verifyToken, adminOnly, getClimateSchedules);
router.get('/alat/:deviceId/climate-data', verifyToken, getClimateData);
router.get('/alat/:deviceId/climate-chart', verifyToken, getClimateChartData);
router.delete('/alat/:deviceId/climate-data', verifyToken, deleteClimateData);
router.delete('/alat/:deviceId/climate-data/filtered', verifyToken, deleteFilteredClimateData);
router.get('/alat/:deviceId/climate-data/all', verifyToken, getAllClimateData);
router.post('/alat/:deviceId/climate-manual', verifyToken, manualClimateControl);
router.get('/alat/:deviceId/control-mode', verifyToken, getControlMode);
router.patch('/alat/:deviceId/control-mode', verifyToken, setControlMode);


// --- Rute Dosing ---
router.get('/alat/:id/dosing-settings', verifyToken, getDosingSettings);
router.patch('/alat/:id/dosing-settings', verifyToken, updateDosingSettings);
router.post('/alat/:id/dosing-manual', verifyToken, manualDosingControl);
router.get('/alat/:id/dosing-data', verifyToken, getDosingData);
router.get('/alat/:id/dosing-chart', verifyToken, getDosingChartData);
router.get('/alat/:id/dosing-data/latest', verifyToken, getLatestDosingData);
router.get('/alat/:id/dosing-data/all', verifyToken, getAllDosingData);
router.delete('/alat/:id/dosing-data', verifyToken, deleteDosingData);
router.delete('/alat/:id/dosing-data/filtered', verifyToken, deleteFilteredDosingData);

// --- Relasi Database ---
Users.hasMany(Devices);
Devices.belongsTo(Users, { foreignKey: 'userId' });

// Relasi Device <-> ClimateSettings (One-to-One)
Devices.hasOne(ClimateSettings, { foreignKey: 'deviceId' });
ClimateSettings.belongsTo(Devices, { 
    foreignKey: 'deviceId',
    onDelete: 'CASCADE' 
});

// <-- [BARU] Relasi Dosing -->
Devices.hasOne(DosingSettings, { foreignKey: 'deviceId' });
DosingSettings.belongsTo(Devices, { 
    foreignKey: 'deviceId',
    onDelete: 'CASCADE' 
});

Devices.hasMany(DosingData, { foreignKey: 'deviceId' });
DosingData.belongsTo(Devices, { 
    foreignKey: 'deviceId',
    onDelete: 'CASCADE' 
});


export default router;