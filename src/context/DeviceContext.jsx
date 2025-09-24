import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api';

// 1. Buat Context
const DeviceContext = createContext();

// Hook kustom untuk mempermudah penggunaan context
export const useDevices = () => {
    return useContext(DeviceContext);
};

// 2. Buat Provider (komponen yang akan "menyediakan" data)
export const DeviceProvider = ({ children }) => {
    const [devices, setDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Ambil daftar semua alat saat pertama kali dimuat
    useEffect(() => {
        const fetchDevices = async () => {
            try {
                const response = await api.get('/alat');
                setDevices(response.data);
                // Set alat pertama sebagai pilihan default
                if (response.data.length > 0) {
                    setSelectedDevice(response.data[0]);
                }
            } catch (error) {
                console.error("Gagal memuat daftar alat:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDevices();
    }, []);
    
    const value = {
        devices,
        selectedDevice,
        setSelectedDevice,
        isLoadingDevices: isLoading
    };

    return (
        <DeviceContext.Provider value={value}>
            {children}
        </DeviceContext.Provider>
    );
};