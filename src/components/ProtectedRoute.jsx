import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
    // Cek apakah ada token di localStorage
    const token = localStorage.getItem('token');

    // Jika ada token, izinkan akses ke halaman yang diminta (menggunakan <Outlet />)
    // Jika tidak ada token, paksa arahkan (redirect) ke halaman login
    return token ? <Outlet /> : <Navigate to="/" replace />;
};

export default ProtectedRoute;