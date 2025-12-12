// src/api.js (VERSI FINAL YANG DIPERBAIKI)
import axios from 'axios';

const api = axios.create({
    // INI BAGIAN YANG PALING PENTING:
    // Pastikan ini adalah alamat server backend Anda
    baseURL: `http://localhost:5000`,
    withCredentials: true 
});

// Interceptor request Anda sudah benar, tidak perlu diubah.
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor response Anda juga sudah benar, tidak perlu diubah.
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        // Perbaikan kecil: Pastikan error.response ada sebelum mengakses status
        if (error.response && error.response.status === 403 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const { data } = await api.get('/token');
                localStorage.setItem('token', data.accessToken);
                // Set header untuk request yang diulang secara manual
                originalRequest.headers['Authorization'] = `Bearer ${data.accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                console.error("Sesi berakhir.", refreshError);
                localStorage.removeItem('token');
                // Arahkan ke halaman login, bukan root
                window.location.href = '/'; 
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
