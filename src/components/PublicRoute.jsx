// src/components/PublicRoute.jsx

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PublicRoute = () => {
    // Cek apakah ada token di localStorage
    const token = localStorage.getItem('token');

    // Jika ADA token, paksa arahkan ke dashboard
    // Jika TIDAK ADA token, izinkan akses ke halaman login/register
    return token ? <Navigate to="/dashboard" replace /> : <Outlet />;
};

export default PublicRoute;