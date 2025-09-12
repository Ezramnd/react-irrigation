// src/context/AuthContext.jsx

import React, { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../api'; // <-- Hanya impor 'api'

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initializeAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const decoded = jwtDecode(token);
                    if (decoded.exp * 1000 > Date.now()) {
                        // Tidak perlu setAuthToken, interceptor akan menanganinya
                        setUser({ id: decoded.id, name: decoded.name, email: decoded.email, role: decoded.role });
                    } else {
                        // Interceptor response di api.js akan mencoba refresh token secara otomatis
                        // saat ada API call pertama yang gagal. Kita bisa coba panggil /me untuk memicunya.
                        try {
                           const { data } = await api.get('/me');
                           setUser(data);
                        } catch (error) {
                           console.log("Gagal refresh token saat inisialisasi.");
                           localStorage.removeItem('token');
                           setUser(null);
                        }
                    }
                } catch (error) {
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