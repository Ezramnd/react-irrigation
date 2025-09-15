// src/api.js (VERSI FINAL REVISI)
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000',
    withCredentials: true 
});

// Interceptor ini akan berjalan di SETIAP request
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

// Interceptor response untuk refresh token tetap sama
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response.status === 403 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const { data } = await api.get('/token');
                localStorage.setItem('token', data.accessToken);
                // Axios akan otomatis menggunakan token baru di request berikutnya
                // karena interceptor request di atas akan mengambilnya dari localStorage
                return api(originalRequest);
            } catch (refreshError) {
                console.error("Sesi berakhir.", refreshError);
                localStorage.removeItem('token');
                window.location.href = '/';
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default api;