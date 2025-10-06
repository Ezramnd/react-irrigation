// src/context/AuthContext.jsx

import React, { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../api'; // <-- Hanya impor 'api'

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

   useEffect(() => {
    const initializeAuth = () => { // Tidak perlu async lagi
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                // Cukup periksa apakah token valid secara client-side
                if (decoded.exp * 1000 > Date.now()) {
                    // Jika valid, set user dari data di dalam token
                    setUser({ id: decoded.id, name: decoded.name, email: decoded.email, role: decoded.role });
                } else {
                    // Jika kedaluwarsa, cukup hapus. 
                    // Biarkan interceptor yang bekerja saat ada API call nanti.
                    localStorage.removeItem('token');
                    setUser(null);
                }
            } catch (error) {
                // Jika token tidak valid/rusak
                localStorage.removeItem('token');
                setUser(null);
            }
        }
        setLoading(false);
    };
    initializeAuth();
}, []);

    const login = (token) => {
        localStorage.setItem('token', token);
        const decoded = jwtDecode(token);
        setUser({ id: decoded.id, name: decoded.name, email: decoded.email, role: decoded.role });
    };

    const logout = async () => {
        try {
            await api.delete('/logout');
        } catch (error) {
            console.error("Gagal logout di server:", error);
        } finally {
            localStorage.removeItem('token');
            setUser(null);
            window.location.href = '/login';
        }
    };

   const authContextValue = {
        user,
        isAuthenticated: !!user,
        loading, // Kirim status loading
        login,
        logout
    };

    // Tampilkan loading screen sederhana saat inisialisasi
    if (loading) {
        return <div>Loading application...</div>
    }

    return (
        <AuthContext.Provider value={authContextValue}>
            {children}
        </AuthContext.Provider>
    );
};

// Buat custom hook agar mudah digunakan
export const useAuth = () => {
    return useContext(AuthContext);
};