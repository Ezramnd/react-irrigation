import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export const ModalRegisterUser = ({ onClose, onUserAdded }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confPassword, setConfPassword] = useState('');
    const [role, setRole] = useState('user');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (password !== confPassword) {
            toast.error("Password dan Konfirmasi Password tidak cocok!");
            return;
        }
        // Panggil fungsi dari parent (UsersPage) untuk handle API call
        onUserAdded({ name, email, password, confPassword, role });
    };

    return (
        <motion.div /* ... (properti motion div untuk backdrop) ... */>
            <motion.div /* ... (properti motion div untuk modal) ... */>
                <h2 className="text-2xl font-bold mb-6">Daftarkan User Baru</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Nama" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 border rounded" />
                    <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-2 border rounded" />
                    <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full p-2 border rounded" />
                    <input type="password" placeholder="Konfirmasi Password" value={confPassword} onChange={e => setConfPassword(e.target.value)} required className="w-full p-2 border rounded" />
                    <select value={role} onChange={e => setRole(e.target.value)} className="w-full p-2 border rounded">
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                    </select>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Batal</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Simpan</button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};