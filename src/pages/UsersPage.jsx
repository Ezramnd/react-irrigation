import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import api from '../api';
import toast, { Toaster } from 'react-hot-toast';
import { FiUsers, FiUserPlus, FiEdit2, FiTrash2, FiSearch, FiRefreshCw, FiDownload, FiAlertTriangle, FiX } from 'react-icons/fi';
import { HiOutlineUserCircle } from 'react-icons/hi';
import { CSVLink } from 'react-csv';
import MainLayout from '../components/MainLayout';

// =================================================================================
// == BAGIAN 1: KOMPONEN MODAL FORM USER YANG BARU (SESUAI DESAIN ANDA) ==
// =================================================================================
const UserFormModal = ({ user, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'user',
    });
    const [isLoading, setIsLoading] = useState(false);

    const isEditing = user != null;

    useEffect(() => {
        if (isEditing) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                password: '', // Password tidak diisi untuk keamanan
                role: user.role || 'user',
            });
        }
    }, [user, isEditing]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        // Untuk edit, jangan kirim password jika tidak diubah
        const dataToSubmit = { ...formData };
        if (isEditing && !dataToSubmit.password) {
            delete dataToSubmit.password;
        }
        await onSave(dataToSubmit);
        setIsLoading(false);
    };

    const title = isEditing ? 'Edit User' : 'Tambahkan User Baru';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden"
            >
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                        <FiX size={22} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-5">
                        <div>
                            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1.5">Nama User</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Masukkan nama lengkap"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="contoh@email.com"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                Password
                                {isEditing && <span className="text-xs text-gray-400 ml-2">(Kosongkan jika tidak diubah)</span>}
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                                required={!isEditing} // Wajib diisi hanya saat menambah user baru
                            />
                        </div>
                        <div>
                            <label htmlFor="role" className="block text-sm font-semibold text-gray-700 mb-1.5">Peran (Role)</label>
                            <select
                                id="role"
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition bg-white"
                            >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-3 p-6 bg-gray-50 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-5 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

// ==============================================================================
// == BAGIAN 2: LOGIKA INTEGRASI MODAL DI KOMPONEN UTAMA (UsersPage) ==
// ==============================================================================
const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [modalState, setModalState] = useState({ isOpen: false, user: null }); // State modal yang disatukan
    const [userToDelete, setUserToDelete] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchUsers = async () => {
        setIsRefreshing(true);
        try {
            const response = await api.get('/users');
            setUsers(response.data);
        } catch (error) {
            toast.error("Gagal mengambil data users.");
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleOpenModal = (user = null) => {
        setModalState({ isOpen: true, user: user });
    };

    const handleCloseModal = () => {
        setModalState({ isOpen: false, user: null });
    };

    const handleSaveUser = async (userData) => {
        const isEditing = modalState.user != null;
        try {
            if (isEditing) {
                await api.patch(`/users/${modalState.user.uuid}`, userData);
                toast.success("User berhasil diperbarui!");
            } else {
                await api.post('/users', userData);
                toast.success("User baru berhasil ditambahkan!");
            }
            handleCloseModal();
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.msg || `Gagal ${isEditing ? 'memperbarui' : 'menambahkan'} user.`);
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

    const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const userHeaders = [{ label: "Nama", key: "name" }, { label: "Email", key: "email" }, { label: "Peran", key: "role" }];
    const currentDate = new Date().toISOString().slice(0, 10);
    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
    const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

    return (
        <MainLayout>
            <Toaster position="top-center" />
            <motion.div
                className="p-4 md:p-6 lg:p-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div variants={itemVariants} className="mb-6">
                    <div className="flex flex-col md:flex-row gap-4 justify-between">
                         <div className="relative w-full md:w-80">
                            </div>
                        <div className="flex gap-2">
                            {users.length > 0 && (
                                <CSVLink data={users} headers={userHeaders} filename={`daftar-user-${currentDate}.csv`} className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                                    <FiDownload className="mr-1" /> Export
                                </CSVLink>
                            )}
                            <button onClick={() => handleOpenModal()} className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                <FiUserPlus className="mr-1" /> Tambah User
                            </button>
                        </div>
                    </div>
                </motion.div>

                {isLoading ? (
                    <div className="flex justify-center items-center p-12">
                        <FiRefreshCw className="animate-spin mr-2 text-blue-600" />
                        <p>Memuat data user...</p>
                    </div>
                ) : (
                    <motion.div variants={itemVariants} className="bg-white p-4 rounded-2xl shadow-lg">
                        <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200">
                           <table className="w-full text-sm text-left text-gray-600">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3">Nama</th>
                                        <th className="px-4 py-3">Email</th>
                                        <th className="px-4 py-3">Peran</th>
                                        <th className="px-4 py-3">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredUsers.map(user => (
                                        <tr key={user.uuid} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium">{user.name}</td>
                                            <td className="px-4 py-3">{user.email}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{user.role}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center space-x-3">
                                                    <button onClick={() => handleOpenModal(user)} className="p-1.5 hover:bg-yellow-100 text-yellow-600 rounded-full transition-colors" title="Edit user"><FiEdit2 /></button>
                                                    <button onClick={() => setUserToDelete(user)} className="p-1.5 hover:bg-red-100 text-red-600 rounded-full transition-colors" title="Hapus user"><FiTrash2 /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </motion.div>
            
            <AnimatePresence>
                {/* =============================================================== */}
                {/* == BAGIAN 3: RENDER MODAL YANG SUDAH DISATUKAN == */}
                {/* =============================================================== */}
                {modalState.isOpen && (
                    <UserFormModal
                        user={modalState.user}
                        onClose={handleCloseModal}
                        onSave={handleSaveUser}
                    />
                )}

                {/* Modal konfirmasi hapus (tetap sama) */}
                {userToDelete && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setUserToDelete(null)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="relative w-full max-w-md p-6 bg-white rounded-2xl shadow-xl">
                           <div className="flex items-start">
                                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                    <FiAlertTriangle className="h-6 w-6 text-red-600" />
                                </div>
                                <div className="ml-4 text-left">
                                    <h3 className="text-lg font-semibold leading-6 text-gray-900">Hapus User</h3>
                                    <p className="text-sm text-gray-500 mt-2">Apakah Anda yakin ingin menghapus user "{userToDelete.name}"? Aksi ini tidak dapat dibatalkan.</p>
                                </div>
                            </div>
                            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 gap-3">
                                <button type="button" className="w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:w-auto" onClick={() => setUserToDelete(null)}>Batal</button>
                                <button type="button" className="w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:w-auto" onClick={() => handleDelete(userToDelete.uuid)}>Hapus</button>
                            </div>
                            <button onClick={() => setUserToDelete(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><FiX size={20} /></button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </MainLayout>
    );
};

export default UsersPage;