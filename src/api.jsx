import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000'
});

// Interceptor untuk MENAMBAHKAN token ke setiap request
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, error => {
    return Promise.reject(error);
});

// --- BAGIAN BARU: Interceptor untuk MENANGANI token kedaluwarsa ---
api.interceptors.response.use(
    (response) => response, // Jika respons sukses, langsung teruskan
    async (error) => {
        const originalRequest = error.config;

        // Jika error adalah 403 dan belum pernah dicoba ulang
        if (error.response.status === 403 && !originalRequest._retry) {
            originalRequest._retry = true; // Tandai bahwa request ini sudah dicoba ulang

            try {
                // Minta accessToken baru menggunakan refreshToken
                const { data } = await axios.get('http://localhost:5000/token', {
                    withCredentials: true // Penting agar cookie refreshToken dikirim
                });

                // Simpan token baru
                localStorage.setItem('token', data.accessToken);
                
                // Atur header untuk request asli yang gagal
                originalRequest.headers['Authorization'] = `Bearer ${data.accessToken}`;

                // Ulangi request asli dengan token baru
                return api(originalRequest);
            } catch (refreshError) {
                // Jika refresh token juga gagal (misal sudah kedaluwarsa),
                // maka pengguna harus login ulang.
                console.error("Refresh token gagal", refreshError);
                // Di sini Anda bisa redirect ke halaman login
                // window.location.href = '/login'; 
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);


export default api;