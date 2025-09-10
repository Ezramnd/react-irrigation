import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import agrifamLogo from '../assets/agrifam.jpg';
import api from '../api';

// Improved Eye Icon Component
const EyeIcon = ({ isOpen }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        {isOpen ? (
            // Eye Open Icon
            <>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </>
        ) : (
            // Eye Closed Icon (shows a crossed-out eye)
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        )}
    </svg>
);

const LoginPage = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [keepLoggedIn, setKeepLoggedIn] = useState(false);
    
    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg('');
        try {
            const response = await api.post('/login', { email, password, keepLoggedIn });
            localStorage.setItem('token', response.data.accessToken);
            setTimeout(() => navigate('/dashboard'), 500);
        } catch (error) {
            console.error('Login failed:', error);
            setErrorMsg(error.response ? error.response.data.msg : 'Login gagal. Periksa koneksi Anda.');
            setIsLoading(false);
        }
    };

    // Animation variants
    const panelVariants = {
        hidden: { opacity: 0, x: -100 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } }
    };

    const formVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut", delay: 0.3 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
    };

    return (
        <div className="flex flex-col lg:flex-row min-h-screen font-sans bg-gray-50">
            {/* Left/Top Panel */}
            <motion.div
                className="flex lg:flex-1 flex-col justify-center items-center p-8 bg-green-900 text-white relative overflow-hidden h-80 lg:h-auto lg:min-h-screen"
                initial="hidden"
                animate="visible"
                variants={panelVariants}
            >
                <motion.div
                    className="absolute -top-20 -left-20 w-72 h-72 bg-green-800 rounded-full opacity-50"
                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 1.5, ease: "easeOut", delay: 1 }}
                />
                <motion.div
                    className="absolute -bottom-24 -right-12 w-96 h-96 bg-green-800/80 rounded-lg transform rotate-45 opacity-40"
                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 1.5, ease: "easeOut", delay: 1.5 }}
                />
                
                <div className="z-10 text-center max-w-sm">
                    <motion.img
                        src={agrifamLogo} alt="Agrifam Logo"
                        className="w-24 h-24 mx-auto mb-4 rounded-full shadow-lg border-4 border-white/70"
                        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5, type: 'spring', stiffness: 100 }}
                    />
                    <motion.h1
                        className="text-3xl lg:text-4xl font-bold"
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
                    >
                        AGRIFAM INDONESIA
                    </motion.h1>
                    <motion.p
                        className="text-white/80 text-base lg:text-lg mt-2"
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
                    >
                       PT. AgriFamili Sarana Exedis Indonesia
                    </motion.p>
                </div>
            </motion.div>

            {/* Right/Bottom Panel (Login Form) */}
            <div className="flex flex-1 flex-col justify-center items-center p-6 sm:p-8">
                <motion.div
                    className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 -mt-32 lg:mt-0 relative z-20"
                    initial="hidden"
                    animate="visible"
                    variants={formVariants}
                >
                    <motion.h1 variants={itemVariants} className="text-2xl sm:text-3xl font-bold mb-2 text-gray-800">
                        Login Portal
                    </motion.h1>
                    <motion.p variants={itemVariants} className="text-gray-500 mb-8">
                        Masukkan email dan password Anda.
                    </motion.p>
                  
                    <AnimatePresence>
                        {errorMsg && (
                            <motion.p
                                className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded-lg mb-6 text-sm font-medium"
                                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            >
                                {errorMsg}
                            </motion.p>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <motion.div variants={itemVariants}>
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">Email</label>
                            <input 
                                type="email" 
                                id="email" 
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500" 
                                placeholder="info@agrifam.link" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                required 
                            />
                        </motion.div>

                        <motion.div variants={itemVariants} className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">Password</label>
                            <div className="relative">
                                <input 
                                    type={showPassword ? 'text' : 'password'} 
                                    id="password" 
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500 pr-12" 
                                    placeholder="••••••••" 
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)} 
                                    required 
                                />
                                <button 
                                    type="button" 
                                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-green-600 transition-colors" 
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    <EyeIcon isOpen={showPassword} />
                                </button>
                            </div>
                        </motion.div>
                      
                        <motion.div variants={itemVariants} className="flex justify-between items-center text-sm">
                            <label className="flex items-center text-gray-600 select-none cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="mr-2 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                    checked={keepLoggedIn}
                                    onChange={(e) => setKeepLoggedIn(e.target.checked)}
                                />
                                Ingat saya
                            </label>
                            <a href="#" className="text-green-600 hover:underline font-medium">Lupa Kata Sandi?</a>
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <motion.button 
                                type="submit" 
                                disabled={isLoading} 
                                className="w-full p-3 bg-green-600 text-white rounded-lg font-bold shadow-lg shadow-green-500/30 hover:bg-green-700 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center" 
                                whileHover={{ scale: 1.02 }} 
                                whileTap={{ scale: 0.98 }}
                            >
                                {isLoading ? (
                                  <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Memproses...
                                  </>
                                ) : (
                                  'Masuk'
                                )}
                            </motion.button>
                        </motion.div>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};

export default LoginPage;