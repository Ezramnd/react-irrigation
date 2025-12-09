import React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import api from '../api';
import { motion } from 'framer-motion';
import RealtimeApexChart from "./RealtimeApexChart";
import { FaThermometerHalf, FaTint, FaFan, FaRobot, FaHandPaper } from 'react-icons/fa';
import { FiDownload, FiClock ,FiChevronLeft, FiChevronRight, FiTrash} from 'react-icons/fi';


const StatCard = ({ icon, title, value, unit, statusInfo = null, onControl = null }) => {
  const isStatusCard = statusInfo !== null;
  const colorClasses = {
    green: { text: 'text-green-500', bg: 'bg-green-500' },
    gray: { text: 'text-gray-500', bg: 'bg-gray-500' },
    red: { text: 'text-red-500', bg: 'bg-red-500' },
  };
  const currentStatusColor = statusInfo ? (colorClasses[statusInfo.color] || colorClasses.gray) : colorClasses.gray;

  return (
    <motion.div
      className="bg-white rounded-2xl shadow-lg p-4 md:p-6 flex flex-col justify-between transform transition-all duration-300 hover:-translate-y-1 h-full"
      whileHover={{ scale: 1.03 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <span className="text-gray-500 text-sm md:text-base font-medium">{title}</span>
          <div className="flex items-baseline space-x-2">
            <h2 className={`font-extrabold text-gray-800 my-1 ${isStatusCard ? 'text-xl md:text-2xl' : 'text-2xl md:text-4xl'}`}>{value}</h2>
            {!isStatusCard && <span className="text-gray-400 text-sm md:text-base font-medium">{unit}</span>}
          </div>
          {isStatusCard && (
            <div className={`flex items-center ${currentStatusColor.text}`}>
              <span className={`inline-block h-2 w-2 md:h-3 md:w-3 ${currentStatusColor.bg} rounded-full mr-2`}></span>
              <span className="text-sm md:text-base font-semibold">{statusInfo.text}</span>
            </div>
          )}
        </div>
        <div className="p-3 md:p-4 rounded-full bg-blue-50 self-start">
          <div className="text-blue-600 text-xl md:text-2xl">
            {icon}
          </div>
        </div>
      </div>
      {onControl && (
        <div className="mt-4 flex items-center space-x-2">
          <button onClick={() => onControl('ON')} className="w-full px-3 py-1.5 text-sm font-semibold text-white bg-green-500 rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400">ON</button>
          <button onClick={() => onControl('OFF')} className="w-full px-3 py-1.5 text-sm font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400">OFF</button>
        </div>
      )}
    </motion.div>
  );
};

const DataTable = ({ data, isLoading, currentPage, totalPages, onPageChange, onDeleteAll, deviceId , onDeleteFiltered}) => {
    
    const [isDownloading, setIsDownloading] = useState(false);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };
    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

const handleDownloadCSV = async () => {
        if (!deviceId) return;
        
        setIsDownloading(true); 
        
        try {
            const response = await api.get(
                `/alat/${deviceId}/climate-data/all`,
                { withCredentials: true }
            );

            const allData = response.data; 

            const headers = ['Tanggal', 'Jam', 'Suhu (°C)', 'Kelembaban (%)', 'Kipas 1', 'Kipas 2'];
            
            const rows = allData.map(row => {
                const suhuNum = parseFloat(row.suhu);
                const suhu = !isNaN(suhuNum) ? suhuNum.toFixed(2) : '--';
                const kelembabanNum = parseFloat(row.kelembaban);
                const kelembaban = !isNaN(kelembabanNum) ? kelembabanNum.toFixed(2) : '--';

                return [
                    formatDate(row.createdAt), 
                    formatTime(row.createdAt), 
                    suhu, 
                    kelembaban, 
                    row.kipas1_status || 'OFF', 
                    row.kipas2_status || 'OFF'  
                ].join(';');
            });

            const csvContent = [
                headers.join(';'), 
                ...rows
            ].join('\n');

            const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
            
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'laporan_historis_climate.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error("Gagal mengunduh CSV:", error);
            alert("Gagal mengunduh data. Silakan coba lagi.");
        } finally {
            setIsDownloading(false); 
        }
    };

    const renderPaginationButtons = () => {
        if (totalPages <= 1) return null;
        let buttons = [];
        buttons.push(
            <button
                key="prev"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
                <FiChevronLeft className="h-5 w-5" />
            </button>
        );
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                buttons.push(
                    <button
                        key={i}
                        onClick={() => onPageChange(i)}
                        className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${
                            i === currentPage
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        {i}
                    </button>
                );
            } else if (i === currentPage - 2 || i === currentPage + 2) {
                buttons.push(<span key={i} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>);
            }
        }
        buttons.push(
            <button
                key="next"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
                <FiChevronRight className="h-5 w-5" />
            </button>
        );
        return buttons;
    };

    return (
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b pb-4">
                <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-3 sm:mb-0">Data Historis Sensor</h2>
                <div className="flex items-center space-x-2">
                    <button 
                        onClick={handleDownloadCSV} 
                        disabled={isDownloading} 
                        className="px-3 py-1.5 md:px-4 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-xs md:text-sm flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed">
                          <FiDownload className="h-4 w-4" />
                          <span>{isDownloading ? 'Mengunduh...' : 'Download CSV'}</span>
                    </button>
                    <button 
                        onClick={() => onDeleteFiltered(30)} // Hapus 30 hari
                        className="px-3 py-1.5 md:px-4 md:py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-semibold text-xs md:text-sm flex items-center space-x-2">
                        <FiTrash className="h-4 w-4" />
                        <span>Hapus &gt; 30 Hari</span>
                    </button>
                    <button 
                        onClick={onDeleteAll} 
                        className="px-3 py-1.5 md:px-4 md:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold text-xs md:text-sm flex items-center space-x-2">
                          <FiTrash className="h-4 w-4" />
                          <span>Hapus Semua</span>
                    </button>
                </div>
            </div>
      
            <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-3 md:px-6 py-2 md:py-3 text-left text-xs md:text-sm font-medium text-gray-700 uppercase tracking-wider">Tanggal & Jam</th>
                                <th scope="col" className="px-3 md:px-6 py-2 md:py-3 text-left text-xs md:text-sm font-medium text-gray-700 uppercase tracking-wider">Suhu</th>
                                <th scope="col" className="px-3 md:px-6 py-2 md:py-3 text-left text-xs md:text-sm font-medium text-gray-700 uppercase tracking-wider">Kelembaban</th>
                                <th scope="col" className="px-3 md:px-6 py-2 md:py-3 text-left text-xs md:text-sm font-medium text-gray-700 uppercase tracking-wider">Kipas 1</th>
                                <th scope="col" className="px-3 md:px-6 py-2 md:py-3 text-left text-xs md:text-sm font-medium text-gray-700 uppercase tracking-wider">Kipas 2</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="5" className="px-3 md:px-6 py-10 text-center text-sm text-gray-500">
                                        Memuat data historis...
                                    </td>
                                </tr>
                            ) : data.length > 0 ? (
                                data.map((row) => (
                                    <tr key={row.id} className="hover:bg-gray-50"> 
                                        <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap">
                                          <div className="text-xs md:text-sm font-medium text-gray-900">{formatDate(row.createdAt)}</div>
                                          <div className="text-xs text-gray-400">{formatTime(row.createdAt)}</div>
                                        </td>
                                        <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm">{row.suhu}°C</td>
                                        <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm">{row.kelembaban}%</td>
                                        <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm">{row.kipas1_status}</td>
                                      <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm">{row.kipas2_status}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-3 md:px-6 py-10 text-center text-sm text-gray-500">
                                        Tidak ada data historis ditemukan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {totalPages > 0 && (
                <nav className="flex items-center justify-between pt-4" aria-label="Pagination">
                    <div className="hidden sm:block">
                          <p className="text-sm text-gray-700">
                                Menampilkan halaman <span className="font-medium">{currentPage}</span> dari <span className="font-medium">{totalPages}</span>
                          </p>
                    </div>
                    <div className="flex-1 flex justify-between sm:justify-end">
                          <div className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                {renderPaginationButtons()}
                          </div>
                    </div>
                </nav>
            )}
        </div>
    );
};


const ToggleSwitch = ({ label, isEnabled, onToggle, disabled = false }) => {
  const handleChange = () => {
    if (disabled) return; 
    onToggle(!isEnabled); 
  };
  
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-gray-700 font-medium">{label}</span>
      <label className={`relative inline-flex items-center ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
        <input 
          type="checkbox" 
          className="sr-only peer" 
          checked={isEnabled} 
          onChange={handleChange} 
          disabled={disabled} 
        />
        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
      </label>
    </div>
  );
};


const ManualControlCard = ({ statusKipas1, statusKipas2, onControl, disabled = false }) => {
  const isKipas1On = statusKipas1.value === 'Aktif';
  const isKipas2On = statusKipas2.value === 'Aktif';

  const handleToggleKipas1 = (isNowOn) => {
    onControl(1, isNowOn ? 'ON' : 'OFF');
  };
  const handleToggleKipas2 = (isNowOn) => {
    onControl(2, isNowOn ? 'ON' : 'OFF');
  };

return (
    <div className={`bg-white rounded-2xl shadow-lg p-4 md:p-6 h-full transition-opacity duration-300 ${disabled ? 'opacity-40' : 'opacity-100'}`}>
    <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4">Kontrol Manual</h2>
    <hr className="mb-4 border-gray-200" />
    <div className="space-y-3">
      <ToggleSwitch 
        label="Kipas 1" 
        isEnabled={isKipas1On} 
        onToggle={handleToggleKipas1} 
        disabled={disabled} 
      />
      <ToggleSwitch 
        label="Kipas 2" 
        isEnabled={isKipas2On} 
        onToggle={handleToggleKipas2} 
        disabled={disabled} 
      />
    </div>
  </div>
  );
};



const ThresholdItem = ({ label, value, iconColorClass, bgColorClass }) => (
  <div className="flex items-center justify-between py-1">
    <div className="flex items-center space-x-3">
      <div className={`p-2 rounded-full ${bgColorClass}`}>
        <FaThermometerHalf className={`text-lg ${iconColorClass}`} />
      </div>
      <span className="text-gray-700 font-medium text-sm">{label}</span>
    </div>
    <span className={`font-bold text-lg px-3 py-1 rounded-lg ${bgColorClass} ${iconColorClass}`}>
      {value}°C
    </span>
  </div>
);

const ThresholdDisplayCard = ({ thresholds, isActive = true }) => {
  

  return (
    <div className={`bg-white rounded-2xl shadow-lg p-4 md:p-6 h-full transition-opacity duration-300 ${!isActive ? 'opacity-40' : 'opacity-100'}`}>
      <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4">Treshold Otomatis</h2>
      <hr className="mb-4 border-gray-200" />
      <div className="space-y-3">
        <ThresholdItem 
          label="Suhu Minimal (Kipas 1 OFF)" 
          value={thresholds.kipas1_min} 
          iconColorClass="text-blue-600"
          bgColorClass="bg-blue-100"
        />
        <ThresholdItem 
          label="Suhu Maksimal (Kipas 1 ON)" 
          value={thresholds.kipas1_max} 
          iconColorClass="text-red-600"
          bgColorClass="bg-red-100"
        />
        <ThresholdItem 
          label="Suhu Minimal (Kipas 2 OFF)" 
          value={thresholds.kipas2_min} 
          iconColorClass="text-blue-600"
          bgColorClass="bg-blue-100"
        />
        <ThresholdItem 
          label="Suhu Maksimal (Kipas 2 ON)" 
          value={thresholds.kipas2_max} 
          iconColorClass="text-red-600"
          bgColorClass="bg-red-100"
        />
      </div>
    </div>
  );
};

const ClimateScheduleTable = ({ schedules, isActive = true }) => (
    <div className={`overflow-x-auto transition-opacity duration-300 ${!isActive ? 'opacity-40' : 'opacity-100'}`}>
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Mulai - Selesai</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jam Mulai</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durasi (Menit)</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kipas Aktif </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {schedules && schedules.length > 0 ? schedules.map((schedule) => (
          <tr key={schedule.id} className="hover:bg-gray-50">
            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{schedule.tanggalMulai} - {schedule.tanggalSelesai}</td>
            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{Array.isArray(schedule.waktu) ? schedule.waktu.join(', ') : ''}</td>
            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{schedule.durasi}</td>
            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
              {Array.isArray(schedule.fans)
                ? schedule.fans.map(id => `Kipas ${id}`).join(', ')
                : ''}
            </td>
          </tr>
        )) : (
          <tr>
            <td colSpan="4" className="text-center py-4 text-sm text-gray-500">Belum ada jadwal climate.</td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

const ModeControlCard = ({ currentMode, onModeChange }) => {
  const isManual = currentMode === 'manual';
  const isAuto = currentMode === 'auto';

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 h-full">
      <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4">Mode Kontrol</h2>
      <div className="flex w-full rounded-lg bg-gray-200 p-1">
        <button
          onClick={() => onModeChange('manual')}
          className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-semibold transition-all duration-300
            ${isManual ? 'bg-blue-600 text-white shadow' : 'text-gray-700 hover:bg-gray-300'}
          `}
        >
          <FaHandPaper className="mr-2" />
          Manual
        </button>
        <button
          onClick={() => onModeChange('auto')}
          className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-semibold transition-all duration-300
            ${isAuto ? 'bg-blue-600 text-white shadow' : 'text-gray-700 hover:bg-gray-300'}
          `}
        >
          <FaRobot className="mr-2" />
          Otomatis
        </button>
      </div>
      <div className="mt-4">
        {isManual && (
          <p className="text-sm text-gray-600">
            Mode <span className="font-bold">Manual</span> aktif. Kontrol Treshold dan Penjadwalan diabaikan.
          </p>
        )}
        {isAuto && (
          <p className="text-sm text-gray-600">
            Mode <span className="font-bold">Otomatis</span> aktif. Sistem akan berjalan berdasarkan Treshold dan Penjadwalan. Kontrol Manual diabaikan.
          </p>
        )}
      </div>
    </div>
  );
};

const ClimateDashboard = ({ deviceId, initialSchedules, initialSettings }) => {
    console.log('ClimateDashboard menerima deviceId:', deviceId);

    const [controlMode, setControlMode] = useState('manual');

    const [suhu, setSuhu] = useState('--');
    const [kelembaban, setKelembaban] = useState('--');
    const [statusKipas1, setStatusKipas1] = useState({ value: 'Non-Aktif', statusInfo: { text: 'Standby', color: 'gray' } });
    const [statusKipas2, setStatusKipas2] = useState({ value: 'Non-Aktif', statusInfo: { text: 'Standby', color: 'gray' } });
    const [chartSeriesData, setChartSeriesData] = useState([
        { name: 'Suhu', data: [] },
        { name: 'Kelembaban', data: [] }
    ]);
    const [isChartLoading, setIsChartLoading] = useState(true);
    
    const defaultSettings = {
        kipas1_min: '--', kipas1_max: '--',
        kipas2_min: '--', kipas2_max: '--'
    };
    const [thresholds, setThresholds] = useState(initialSettings || defaultSettings);
    
    const [climateSchedules, setClimateSchedules] = useState(initialSchedules || []);

    const suhuRef = useRef('--');
    const kelembabanRef = useRef('--');
    const kipas1StatusRef = useRef('OFF');
    const kipas2StatusRef = useRef('OFF');
    const socketRef = useRef(null);
    const dataLimit = 10;   

    const [historicalData, setHistoricalData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [refetchTrigger, setRefetchTrigger] = useState(0);
    const [tableRefetchTrigger, setTableRefetchTrigger] = useState(0);
    
    useEffect(() => {
        socketRef.current = io('http://localhost:5000');
        const socket = socketRef.current;

        socket.on('update_suhu', (data) => {
            const formattedSuhu = parseFloat(data).toFixed(2);
            setSuhu(formattedSuhu);
            suhuRef.current = formattedSuhu;
        });

        socket.on('update_kelembaban', (data) => {
            const formattedKelembaban = parseFloat(data).toFixed(2);
            setKelembaban(formattedKelembaban);
            kelembabanRef.current = formattedKelembaban;
        });

        socket.on('update_relay_1', (status) => {
            kipas1StatusRef.current = status;
            setStatusKipas1(status === 'ON'
                ? { value: 'Aktif', statusInfo: { text: 'Berjalan', color: 'green' } }
                : { value: 'Non-Aktif', statusInfo: { text: 'Standby', color: 'gray' } }
            );
        });

        socket.on('update_relay_2', (status) => {
            kipas2StatusRef.current = status;
            setStatusKipas2(status === 'ON'
                ? { value: 'Aktif', statusInfo: { text: 'Berjalan', color: 'green' } }
                : { value: 'Non-Aktif', statusInfo: { text: 'Standby', color: 'gray' } }
            );
        });

        socket.on('update_thresholds', (data) => {
            console.log("Menerima treshold baru:", data);
            setThresholds(data);
        });

        socket.on('new_historical_data', () => {
            console.log("Sinyal data historis baru diterima!");

            setCurrentPage(prevCurrentPage => {
                if (prevCurrentPage === 1) {
                    setTableRefetchTrigger(prevTrigger => prevTrigger + 1);
                }
                return prevCurrentPage;
            });
        });

        const logInterval = setInterval(() => {
            if (suhuRef.current !== '--' && kelembabanRef.current !== '--') {
                
                const newTimestamp = new Date().getTime(); 
                const newSuhu = parseFloat(suhuRef.current);
                const newKelembaban = parseFloat(kelembabanRef.current);
                
                if (window.ApexCharts) {
                    window.ApexCharts.exec('climate-sensor-chart', 'appendData', [
                        { 
                            data: [[newTimestamp, newSuhu]] 
                        },
                        { 
                            data: [[newTimestamp, newKelembaban]] 
                        }
                    ]);
                }
            }
        }, 30000);

        return () => {
            clearInterval(logInterval);
            socket.disconnect();
            socket.off('update_suhu');
            socket.off('update_kelembaban');
            socket.off('update_relay_1');
            socket.off('update_relay_2');
            socket.off('update_thresholds');
            socket.off('new_historical_data');
        };
    }, [deviceId]); 

    useEffect(() => {
        const fetchInitialChartData = async () => {
            if (!deviceId) return;
            setIsChartLoading(true);
            try {
                const response = await api.get(
                    `/alat/${deviceId}/climate-chart`,
                    { withCredentials: true }
                );
                
                // 
                const data = response.data; 

                const suhuData = [];
                const kelembabanData = [];

                for (let i = data.length - 1; i >= 0; i--) {
                    const item = data[i];
                    const timestamp = new Date(item.createdAt).getTime();
                    
                    const suhuVal = parseFloat(item.suhu);
                    const humVal = parseFloat(item.kelembaban);
                    
                    if (!isNaN(timestamp)) {
                        if (!isNaN(suhuVal)) {
                            suhuData.push([timestamp, suhuVal]);
                        }
                        if (!isNaN(humVal)) {
                            kelembabanData.push([timestamp, humVal]);
                        }
                    }
                }

                setChartSeriesData([
                    { name: 'Suhu', data: suhuData },
                    { name: 'Kelembaban', data: kelembabanData }
                ]);

            } catch (error) {
                console.error("Gagal mengambil data awal chart:", error);
                setChartSeriesData([{ name: 'Suhu', data: [] }, { name: 'Kelembaban', data: [] }]);
            }
            setIsChartLoading(false);
        };

        fetchInitialChartData();
    }, [deviceId, refetchTrigger]); 

    useEffect(() => {
        const fetchHistoricalData = async () => {
            if (!deviceId) return; 
            
            setIsLoadingHistory(true);
            try {
                const response = await api.get(
                    `/alat/${deviceId}/climate-data?page=${currentPage}&limit=${dataLimit}`, 
                    { withCredentials: true } 
                );
                
                setHistoricalData(response.data.data);
                setTotalPages(response.data.totalPages);

            } catch (error) {
                console.error("Gagal mengambil data historis:", error);
                setHistoricalData([]);
                setTotalPages(0);
            }
            setIsLoadingHistory(false);
        };

        fetchHistoricalData();
    }, [currentPage, deviceId, dataLimit, tableRefetchTrigger]);

    useEffect(() => {
        const fetchControlMode = async () => {
            if (!deviceId) return;
            try {
                const response = await api.get(
                    `/alat/${deviceId}/control-mode`,
                    { withCredentials: true }
                );
                setControlMode(response.data.mode); 
            } catch (error) {
                console.error("Gagal mengambil mode kontrol:", error);
            }
        };
        fetchControlMode();
    }, [deviceId]);
    useEffect(() => {
        const fetchSettings = async () => {
            if (!deviceId) return;
            try {
                const response = await api.get(`/alat/${deviceId}/climate-settings`, { 
                    withCredentials: true 
                });
                
                const data = response.data;
                
                if (data) {
                    // KUNCI PERBAIKAN: Mapping nama dari Database ke Frontend
                    // Backend mengirim: minSuhuKipas1
                    // Frontend butuh: kipas1_min
                    setThresholds({
                        kipas1_min: data.minSuhuKipas1 || '--', 
                        kipas1_max: data.maxSuhuKipas1 || '--',
                        kipas2_min: data.minSuhuKipas2 || '--',
                        kipas2_max: data.maxSuhuKipas2 || '--'
                    });
                }
            } catch (error) {
                console.error("Gagal mengambil settings treshold:", error);
            }
        };

        fetchSettings();
    }, [deviceId]);

// ----------------------------8DES----------------------------
useEffect(() => {
    const fetchSchedules = async () => {
            if (!deviceId) return;
            
            try {
                // 1. Panggil API (Endpoint sudah benar 'climate-jadwal')
                const response = await api.get(
                    `/alat/${deviceId}/climate-jadwal`, 
                    { withCredentials: true }
                );
                
                const rawData = response.data;
                console.log("🔍 Data Jadwal Raw dari DB:", rawData); // Cek console browser untuk melihat format asli

                // 2. Format Ulang Data (Dengan Smart Detection)
                const formattedSchedules = rawData.map(schedule => {
                    let activeFans = [];

                    // --- PRIORITAS A: Cek kolom 'fans' (Format Array atau String JSON) ---
                    // Ini yang kemungkinan besar dikirim oleh Backend Anda saat ini
                    if (schedule.fans) {
                        if (Array.isArray(schedule.fans)) {
                            // Jika database mengirim Array asli: ['1', '2']
                            activeFans = schedule.fans;
                        } else if (typeof schedule.fans === 'string') {
                            // Jika database mengirim String: "['1', '2']"
                            try {
                                // Trik: Ubah kutip satu (') jadi kutip dua (") agar valid JSON
                                const cleanString = schedule.fans.replace(/'/g, '"');
                                activeFans = JSON.parse(cleanString);
                            } catch (e) {
                                console.warn("Gagal parse format fans:", schedule.fans);
                            }
                        }
                    }

                    // --- PRIORITAS B: Fallback ke kolom Boolean lama (fan1, fan2) ---
                    // Hanya dijalankan jika Prioritas A kosong/gagal (untuk backward compatibility)
                    if (activeFans.length === 0) {
                        if (schedule.fan1 === true || schedule.fan1 === 1 || schedule.fan1 === "1") activeFans.push('1');
                        if (schedule.fan2 === true || schedule.fan2 === 1 || schedule.fan2 === "1") activeFans.push('2');
                    }
                    
                    // Pastikan format data string agar aman ditampilkan di tabel
                    activeFans = activeFans.map(String);

                    // 3. Mapping Data Lain
                    return {
                        id: schedule.id,
                        // Antisipasi perbedaan nama kolom (tanggalMulai vs startDate)
                        tanggalMulai: new Date(schedule.tanggalMulai || schedule.startDate).toLocaleDateString('id-ID'),
                        tanggalSelesai: new Date(schedule.tanggalSelesai || schedule.endDate).toLocaleDateString('id-ID'),
                        // Pastikan waktu selalu Array
                        waktu: Array.isArray(schedule.waktu) ? schedule.waktu : [schedule.waktu], 
                        durasi: schedule.durasi,
                        fans: activeFans // Hasil deteksi di atas
                    };
                });

                setClimateSchedules(formattedSchedules);
                
            } catch (error) {
                console.error("Gagal mengambil jadwal climate:", error);
            }
        };

        fetchSchedules();
    }, [deviceId]);
    // ----------------------------8DES--------------------------


    const handleDeleteAllHistory = async () => {    
        if (!window.confirm("Apakah Anda yakin ingin menghapus SEMUA data historis climate untuk alat ini? Tindakan ini tidak dapat dibatalkan.")) {
            return;
        }

        if (!deviceId) return;

        try {
            setIsLoadingHistory(true);
            setIsChartLoading(true);

            await api.delete(
                `/alat/${deviceId}/climate-data`,
                { withCredentials: true }
            );

            alert("Data historis berhasil dihapus.");

            setRefetchTrigger(prev => prev + 1);
            setTableRefetchTrigger(prev => prev + 1);

            if (currentPage !== 1) {
                setCurrentPage(1);
            }

        } catch (error) {
            console.error("Gagal menghapus data historis:", error);
            alert("Gagal menghapus data. Silakan coba lagi.");
            setIsLoadingHistory(false);
            setIsChartLoading(false);
        }
    };

    const handleDeleteFilteredData = async (days) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus data historis yang lebih tua dari ${days} hari? Tindakan ini tidak dapat dibatalkan.`)) {
        return;
    }

    if (!deviceId) return;

    try {
        setIsLoadingHistory(true);
        setIsChartLoading(true);

        await api.delete(
            `/alat/${deviceId}/climate-data/filtered`,
            { 
                data: { days: days }, 
                withCredentials: true 
            }
        );

        alert(`Data yang lebih tua dari ${days} hari berhasil dihapus.`);

        setRefetchTrigger(prev => prev + 1);
        setTableRefetchTrigger(prev => prev + 1);

        if (currentPage !== 1) {
            setCurrentPage(1);
        }

    } catch (error) {
        console.error(`Gagal menghapus data > ${days} hari:`, error);
        alert("Gagal menghapus data. Silakan coba lagi.");
        setIsLoadingHistory(false);
        setIsChartLoading(false);
    }
};

    const handleFanControl = async (fanNumber, command) => {
        if (controlMode !== 'manual') {
            alert("Mode Otomatis sedang aktif. Ubah ke Mode Manual untuk mengontrol kipas.");
            return;
        }
    
    const target = fanNumber === 1 ? 'fan1' : 'fan2';
        const newState = command === 'ON'
            ? { value: 'Aktif', statusInfo: { text: 'Berjalan', color: 'green' } }
            : { value: 'Non-Aktif', statusInfo: { text: 'Standby', color: 'gray' } };
        let oldState;
        if (fanNumber === 1) {
            oldState = statusKipas1;
            setStatusKipas1(newState);
            kipas1StatusRef.current = command;
        } else if (fanNumber === 2) {
            oldState = statusKipas2;
            setStatusKipas2(newState);
            kipas2StatusRef.current = command;
        }
        try {
            if (!deviceId) {
                console.error("Device ID tidak ditemukan!");
                throw new Error("Device ID invalid");
            }
            await api.post(
                `/alat/${deviceId}/climate-manual`,
                { target: target, state: command },
                { withCredentials: true }
            );
        } catch (error) {
            console.error("Gagal mengirim perintah manual climate:", error);
            if (fanNumber === 1) {
                setStatusKipas1(oldState);
                kipas1StatusRef.current = oldState.value === 'Aktif' ? 'ON' : 'OFF';
            } else if (fanNumber === 2) {
                setStatusKipas2(oldState);
                kipas2StatusRef.current = oldState.value === 'Aktif' ? 'ON' : 'OFF';
            }
            alert("Gagal mengirim perintah. Silakan coba lagi.");
        }
    };
   
    const handleModeChange = async (newMode) => {
      if (newMode === controlMode) return;
        const oldMode = controlMode; 
        setControlMode(newMode);
      try {
            await api.patch(
                `/alat/${deviceId}/control-mode`,
                { mode: newMode }, 
                { withCredentials: true }
            );
            console.log(`Mode berhasil diubah ke ${newMode} di server.`);

        } catch (error) {
            console.error("Gagal mengubah mode kontrol:", error);
            alert("Gagal mengubah mode. Mengembalikan ke mode sebelumnya.");
            setControlMode(oldMode);
        }
    };

    const statsData = [
        { title: 'Suhu', value: suhu, unit: '°C', icon: <FaThermometerHalf size={24} />, onControl: null },
        { title: 'Kelembaban', value: kelembaban, unit: '%', icon: <FaTint size={24} />, onControl: null },
        { 
           title: 'Status Kipas 1', 
            value: statusKipas1.value, 
            statusInfo: statusKipas1.statusInfo, 
            icon: <FaFan size={24} />,
            onControl: null
        },
        { 
            title: 'Status Kipas 2', 
            value: statusKipas2.value, 
            statusInfo: statusKipas2.statusInfo, 
            icon: <FaFan size={24} />,
            onControl: null
        }
    ];

    const itemVariants = { 
        hidden: { y: 20, opacity: 0 }, 
        visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } } 
    };

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 mb-6 md:mb-8">
                {statsData.map((stat, index) => (
                    <motion.div key={index} variants={itemVariants}>
                        <StatCard 
                          icon={stat.icon}
                          title={stat.title}
                          value={stat.value}
                          unit={stat.unit}
                          statusInfo={stat.statusInfo}
                          onControl={stat.onControl}
                        />
                    </motion.div>
                ))}
            </div>

            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 mb-6 md:mb-8">
                <div className="flex flex-col gap-4 md:gap-8">
                    <motion.div variants={itemVariants}>
                        <ModeControlCard 
                            currentMode={controlMode}
                            onModeChange={handleModeChange}
                        />
                    </motion.div>
                    <motion.div variants={itemVariants}>
                        <ManualControlCard 
                            statusKipas1={statusKipas1}
                            statusKipas2={statusKipas2}
                            onControl={handleFanControl}
                            disabled={controlMode !== 'manual'}
                        />
                    </motion.div>
                </div>

                <motion.div variants={itemVariants}>
                    <ThresholdDisplayCard 
                        thresholds={thresholds} 
                        // Non-aktifkan (abu-abu) jika mode BUKAN auto
                        isActive={controlMode === 'auto'}
                    />
                </motion.div>
            </div>

{/* Tempat terakhir letak Grafik */}

            <motion.div variants={itemVariants} className="mb-6 md:mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-lg">
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-3 flex items-center">
                    <FiClock className="mr-2" /> Jadwal Climate Otomatis
                </h3>
                <ClimateScheduleTable 
                    schedules={climateSchedules} 
                    isActive={controlMode === 'auto'}
                />
            </div>
            </motion.div>

            <motion.div variants={itemVariants}>
                <DataTable 
                    data={historicalData} 
                    isLoading={isLoadingHistory}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(newPage) => setCurrentPage(newPage)}
                    onDeleteAll={handleDeleteAllHistory}
                    onDeleteFiltered={handleDeleteFilteredData}
                    deviceId={deviceId}
                />
            </motion.div>
        </>
    );
};

export default ClimateDashboard;