// src/components/AdminRoute.jsx

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = () => {
    const { isAuthenticated, user, loading } = useAuth();

    // Jika context masih dalam proses loading, jangan render apa pun
    if (loading) {
        return <div>Memverifikasi otorisasi...</div>;
    }

    // Jika sudah login DAN rolenya adalah 'admin', izinkan akses
    if (isAuthenticated && user.role === 'admin') {
        return <Outlet />;
    }

    // Jika sudah login tapi BUKAN admin, lempar ke dashboard
    if (isAuthenticated && user.role !== 'admin') {
        return <Navigate to="/dashboard" replace />;
    }
    
    // Jika belum login sama sekali, lempar ke halaman login
    return <Navigate to="/login" replace />;
};

export default AdminRoute;