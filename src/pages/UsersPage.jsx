// pages/UsersPage.jsx

import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import api from '../api';
import toast, { Toaster } from 'react-hot-toast';
import MainLayout from '../components/MainLayout';
import { ModalRegisterUser } from '../components/ModalRegisterUser';
import { ModalEditUser } from '../components/ModalEditUser';

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState(null);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/users');
            setUsers(response.data);
        } catch (error) {
            toast.error("Gagal mengambil data users.");
            console.error("Gagal fetch users:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleRegister = async (userData) => {
        try {
            await api.post('/users', userData);
            toast.success("User baru berhasil didaftarkan!");
            setIsRegisterOpen(false);
            fetchUsers(); // Muat ulang daftar user
        } catch (error) {
            toast.error(error.response?.data?.msg || "Gagal mendaftarkan user.");
        }
    };

    const handleUpdate = async (userId, userData) => {
        try {
            await api.patch(`/users/${userId}`, userData);
            toast.success("User berhasil diperbarui!");
            setUserToEdit(null);
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.msg || "Gagal memperbarui user.");
        }
    };

    const handleDelete = async (userId) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus user ini?")) {
            try {
                await api.delete(`/users/${userId}`);
                toast.success("User berhasil dihapus!");
                fetchUsers();
            } catch (error) {
                toast.error(error.response?.data?.msg || "Gagal menghapus user.");
            }
        }
    };

    return (
        <MainLayout>
            <Toaster position="top-center" />
            <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                    <button onClick={() => setIsRegisterOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        + Daftarkan User Baru
                    </button>
                </div>
                {isLoading ? <p>Memuat...</p> : (
                    <div className="bg-white p-4 rounded-lg shadow">
                        <table className="w-full">
                            <thead className="border-b">
                                <tr>
                                    <th className="text-left p-2">Nama</th>
                                    <th className="text-left p-2">Email</th>
                                    <th className="text-left p-2">Peran</th>
                                    <th className="text-left p-2">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id} className="border-b">
                                        <td className="p-2">{user.name}</td>
                                        <td className="p-2">{user.email}</td>
                                        <td className="p-2">{user.role}</td>
                                        <td className="p-2 space-x-2">
                                            <button onClick={() => setUserToEdit(user)} className="text-yellow-500">Edit</button>
                                            <button onClick={() => handleDelete(user.id)} className="text-red-500">Hapus</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            
            <AnimatePresence>
                {isRegisterOpen && <ModalRegisterUser onClose={() => setIsRegisterOpen(false)} onUserAdded={handleRegister} />}
                {userToEdit && <ModalEditUser user={userToEdit} onClose={() => setUserToEdit(null)} onUserUpdated={handleUpdate} />}
            </AnimatePresence>
        </MainLayout>
    );
};

export default UsersPage;