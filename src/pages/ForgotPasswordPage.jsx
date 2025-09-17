import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        try {
            const response = await api.post('/forgot-password', { email });
            setMessage(response.data.msg);
        } catch (error) {
            setMessage(error.response?.data?.msg || 'Terjadi kesalahan.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center">Lupa Password</h2>
                <form onSubmit={handleSubmit}>
                    <input 
                        type="email" 
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="Masukkan alamat email Anda"
                        className="w-full p-3 mb-4 border rounded"
                        required
                    />
                    <button type="submit" className="w-full bg-green-600 text-white p-3 rounded">
                        Kirim Link Reset
                    </button>
                </form>
                {message && <p className="mt-4 text-center text-sm text-gray-600">{message}</p>}

                <div className="text-center mt-6">
                    <Link to="/" className="text-sm font-semibold text-green-600 hover:underline">
                        &larr; Kembali ke Login
                    </Link>
                </div>

            </div>
        </div>
    );
};

export default ForgotPasswordPage;