import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export const ModalEditUser = ({ user, onClose, onUserUpdated }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('user');
    const [password, setPassword] = useState('');

    useEffect(() => {
        if (user) {
            setName(user.name);
            setEmail(user.email);
            setRole(user.role);
        }
    }, [user]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onUserUpdated(user.id, { name, email, role, password });
    };

    return (
        <motion.div /* ... */>
            <motion.div /* ... */>
                <h2 className="text-2xl font-bold mb-6">Edit User: {name}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* ... (input fields sama seperti register, tapi password opsional) ... */}
                    <input type="password" placeholder="Password Baru (kosongkan jika tidak diubah)" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 border rounded" />
                    {/* ... (tombol) ... */}
                </form>
            </motion.div>
        </motion.div>
    );
};