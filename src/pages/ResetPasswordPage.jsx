import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import toast, { Toaster } from 'react-hot-toast';

const ResetPasswordPage = () => {
    const { token } = useParams(); // Mengambil token dari URL
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confPassword, setConfPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password.length < 6) {
            setError('Password minimal harus 6 karakter.');
            return;
        }
        if (password !== confPassword) {
            setError('Password dan Konfirmasi Password tidak cocok.');
            return;
        }

        setError('');
        setMessage('');
        setIsLoading(true);

        try {
            const response = await api.post(`/reset-password/${token}`, { password, confPassword });
            setMessage(response.data.msg);
            toast.success(response.data.msg);

            // Arahkan kembali ke halaman login setelah 3 detik
            setTimeout(() => navigate('/'), 3000);

        } catch (err) {
            const errorMsg = err.response?.data?.msg || 'Gagal me-reset password. Token mungkin tidak valid.';
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
            <Toaster position="top-center" />
            <div className="p-8 bg-white rounded-2xl shadow-lg w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Buat Password Baru</h2>

                {!message ? (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-600">Password Baru</label>
                            <input 
                                type="password" 
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-600">Konfirmasi Password Baru</label>
                            <input 
                                type="password" 
                                value={confPassword}
                                onChange={e => setConfPassword(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                required
                            />
                        </div>

                        {error && <p className="text-sm text-center text-red-600">{error}</p>}

                        <button 
                            type="submit" 
                            className="w-full bg-green-600 text-white font-semibold p-3 rounded-lg hover:bg-green-700 disabled:bg-green-300"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Menyimpan...' : 'Reset Password'}
                        </button>
                    </form>
                ) : (
                    <div className="text-center">
                        <p className="text-green-600">{message}</p>
                        <p className="text-sm text-gray-500 mt-2">Anda akan diarahkan ke halaman Login...</p>
                        <Link to="/" className="text-green-600 hover:underline mt-4 inline-block">Login Sekarang</Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResetPasswordPage;   