import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import api from '../api';
import toast, { Toaster } from 'react-hot-toast';
import { FiUserPlus, FiEdit2, FiTrash2, FiRefreshCw, FiAlertTriangle, FiX } from 'react-icons/fi';
import MainLayout from '../components/MainLayout';

// ================================================================
// == Komponen Modal (Register & Edit digabung menjadi satu) ==
// ================================================================
const UserFormModal = ({ user, onClose, onSave }) => {
    const isEditing = !!user; // Cek apakah ini mode edit
    const [formData, setFormData] = useState({});

    useEffect(() => {
        // Isi form saat mode edit, atau kosongkan saat mode tambah baru
        setFormData({
            name: isEditing ? user.name : '',
            email: isEditing ? user.email : '',
            password: '', // Selalu kosongkan password
            confPassword: '',
            role: isEditing ? user.role : 'user'
        });
    }, [user, isEditing]);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Cek konfirmasi password hanya jika password baru diisi
        if (formData.password && formData.password !== formData.confPassword) {
            return toast.error("Password dan Konfirmasi Password tidak cocok!");
        }
        await onSave(formData);
    };

    return (
        <motion.div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
            <motion.div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-800">{isEditing ? 'Edit User' : 'Tambahkan User Baru'}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100"><FiX size={22} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <input name="name" value={formData.name} onChange={handleChange} placeholder="Nama User" required className="w-full p-3 border rounded-lg" />
                        <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Email" required className="w-full p-3 border rounded-lg" />
                        <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder={isEditing ? "Password Baru (kosongkan jika tak diubah)" : "Password"} required={!isEditing} className="w-full p-3 border rounded-lg" />
                        <input name="confPassword" type="password" value={formData.confPassword} onChange={handleChange} placeholder="Konfirmasi Password" required className="w-full p-3 border rounded-lg" />
                        <select name="role" value={formData.role} onChange={handleChange} className="w-full p-3 border rounded-lg bg-white">
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 p-6 bg-gray-50 border-t">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 bg-white border rounded-lg font-semibold hover:bg-gray-100">Batal</button>
                        <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">Simpan</button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

// ================================================================
// == Komponen Halaman Utama (UsersPage) ==
// ================================================================
const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modalState, setModalState] = useState({ isOpen: false, user: null });
    const [userToDelete, setUserToDelete] = useState(null);

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/users');
            setUsers(response.data);
        } catch (error) {
            toast.error("Gagal mengambil data users.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleSaveUser = async (userData) => {
        const isEditing = !!modalState.user;
        const dataToSubmit = { ...userData };
        if (isEditing && !dataToSubmit.password) {
            delete dataToSubmit.password;
        }

        try {
            if (isEditing) {
                await api.patch(`/users/${modalState.user.id}`, dataToSubmit);
                toast.success("User berhasil diperbarui!");
            } else {
                await api.post('/users', dataToSubmit);
                toast.success("User baru berhasil ditambahkan!");
            }
            setModalState({ isOpen: false, user: null });
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.msg || `Gagal menyimpan user.`);
        }
    };

    const handleDelete = async (userId) => {
        try {
            await api.delete(`/users/${userId}`);
            toast.success("User berhasil dihapus!");
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.msg || "Gagal menghapus user.");
        } finally {
            setUserToDelete(null);
        }
    };

    return (
        <MainLayout>
            <Toaster position="top-center" />
            <div className="grid grid-cols-1">
                <div className="flex justify-end items-center mb-6">
                        <button onClick={() => setModalState({ isOpen: true, user: null })} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            <FiUserPlus /> Tambah User
                        </button>
                </div>
                {isLoading ? <p className="text-center">Memuat...</p> : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="text-left p-3">Nama</th>
                                    <th className="text-left p-3">Email</th>
                                    <th className="text-left p-3">Peran</th>
                                    <th className="text-left p-3">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id} className="border-b">
                                        <td className="p-3">{user.name}</td>
                                        <td className="p-3">{user.email}</td>
                                        <td className="p-3">{user.role}</td>
                                        <td className="p-3 flex gap-2">
                                            <button onClick={() => setModalState({ isOpen: true, user: user })} className="text-yellow-500 hover:text-yellow-700"><FiEdit2 /></button>
                                            <button onClick={() => setUserToDelete(user)} className="text-red-500 hover:text-red-700"><FiTrash2 /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            
            <AnimatePresence>
                {modalState.isOpen && <UserFormModal user={modalState.user} onClose={() => setModalState({ isOpen: false, user: null })} onSave={handleSaveUser} />}
                {userToDelete && (
                    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/40" onClick={() => setUserToDelete(null)} />
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="relative w-full max-w-md p-6 bg-white rounded-2xl shadow-xl">
                            <div className="flex items-start">
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                                    <FiAlertTriangle className="h-6 w-6 text-red-600" />
                                </div>
                                <div className="ml-4 text-left">
                                    <h3 className="text-lg font-semibold text-gray-900">Hapus User</h3>
                                    <p className="text-sm text-gray-500 mt-2">Yakin ingin menghapus "{userToDelete.name}"? Aksi ini tidak dapat dibatalkan.</p>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end gap-3">
                                <button type="button" className="px-4 py-2 bg-white border rounded-lg" onClick={() => setUserToDelete(null)}>Batal</button>
                                <button type="button" className="px-4 py-2 bg-red-600 text-white rounded-lg" onClick={() => handleDelete(userToDelete.id)}>Hapus</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </MainLayout>
    );
};

export default UsersPage;