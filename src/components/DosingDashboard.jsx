import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import api from '../api';
import RealtimeApexChart from "./RealtimeApexChart"; 
import { FaTint, FaThermometerHalf, FaCrosshairs, FaHandPaper, FaClock, FaInfoCircle } from 'react-icons/fa';
import { FiDownload, FiChevronLeft, FiChevronRight, FiTrash2 } from 'react-icons/fi';

const socket = io('http://localhost:5000'); 

// --- KOMPONEN REUSABLE ---

const StatCard = ({ icon, title, value, unit, statusInfo = null }) => {
  const isStatusCard = statusInfo !== null;
  const colorClasses = {
    green: { text: 'text-green-600', bg: 'bg-green-100', border: 'border-green-200' },
    gray: { text: 'text-gray-500', bg: 'bg-gray-100', border: 'border-gray-200' },
    blue: { text: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200' },
  };
  const currentStatusColor = statusInfo ? (colorClasses[statusInfo.color] || colorClasses.gray) : colorClasses.gray;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">{title}</span>
          <div className="flex items-baseline gap-2 mt-3">
            <h2 className={`font-bold text-gray-900 ${isStatusCard ? 'text-2xl' : 'text-4xl'}`}>
              {value}
            </h2>
            {!  isStatusCard && <span className="text-gray-400 text-sm font-medium">{unit}</span>}
          </div>
          {isStatusCard && (
            <div className={`flex items-center mt-3 px-3 py-1 rounded-full w-fit ${currentStatusColor.bg} border ${currentStatusColor.border}`}>
              <span className={`inline-block h-2 w-2 rounded-full mr-2 ${statusInfo.  color === 'green' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
              <span className={`text-xs font-bold ${currentStatusColor.text}`}>{statusInfo.text}</span>
            </div>
          )}
        </div>
        <div className="p-4 rounded-xl bg-blue-50 text-blue-600 text-2xl">
          {icon}
        </div>
      </div>
    </div>
  );
};

const ToggleSwitch = ({ label, isEnabled, onToggle }) => {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
      <span className="text-gray-700 font-medium text-sm">{label}</span>
      <button 
        onClick={() => onToggle(!isEnabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          isEnabled ?   'bg-green-500' : 'bg-gray-300'
        }`}
      >
        <span className={`${isEnabled ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
      </button>
    </div>
  );
};

// --- KOMPONEN KARTU KONTROL & SETTING ---

const DosingManualControlCard = ({ statusPompaA, statusPompaB, onControl }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
        <FaHandPaper className="text-blue-500" /> Kontrol Manual
      </h2>
      <div className="space-y-1">
        <ToggleSwitch 
          label="Pompa Nutrisi A" 
          isEnabled={statusPompaA.  value === 'Aktif'} 
          onToggle={(val) => onControl('pumpA', val ?   'ON' : 'OFF')} 
        />
        <ToggleSwitch 
          label="Pompa Nutrisi B" 
          isEnabled={statusPompaB. value === 'Aktif'} 
          onToggle={(val) => onControl('pumpB', val ?  'ON' : 'OFF')} 
        />
      </div>
    </div>
  );
};

const SettingsDisplayCard = ({ settings }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
        <FaCrosshairs className="text-green-600" /> Kontrol Otomatis
      </h2>
      
      {/* Jadwal */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
        <FaClock className="text-blue-600 flex-shrink-0" />
        <span className="text-sm text-gray-700">
          <span className="font-semibold">{settings.startTime_hour || '00'}:00 - {settings.endTime_hour || '24'}:00</span>
        </span>
      </div>

      {/* Parameter Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="text-xs text-gray-600 mb-1 uppercase font-bold">Target PPM</div>
          <div className="text-2xl font-bold text-green-700">{settings.targetPPM || '--'}<span className="text-xs ml-1">PPM</span></div>
        </div>
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-xs text-gray-600 mb-1 uppercase font-bold">Durasi</div>
          <div className="text-2xl font-bold text-blue-700">{settings.pumpDuration_sec || '--'}<span className="text-xs ml-1">Detik</span></div>
        </div>
        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
          <div className="text-xs text-gray-600 mb-1 uppercase font-bold">Interval</div>
          <div className="text-2xl font-bold text-amber-700">{settings.  checkInterval_sec ?    Math.round(settings.checkInterval_sec / 60) : '--'}<span className="text-xs ml-1">Menit</span></div>
        </div>
        <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
          <div className="text-xs text-gray-600 mb-1 uppercase font-bold">Limit Pompa Harian</div>
          <div className="text-2xl font-bold text-purple-700">{settings.dailyPumpLimit || '--'}<span className="text-xs ml-1">/hari</span></div>
        </div>
      </div>
    </div>
  );
};

// --- KOMPONEN TABEL ---

const DosingDataTable = ({ data, isLoading, currentPage, totalPages, onPageChange, onDeleteAll, deviceId, onDeleteFiltered }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const formatTime = (dateString) => new Date(dateString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const handleDownloadCSV = async () => {
    if (!deviceId) return;
    setIsDownloading(true);
    try {
      await api.get(`/alat/${deviceId}/dosing-data/all`, { withCredentials: true });
      alert("Fitur Download CSV Berjalan (Cek Console Backend untuk implementasi file)");
    } catch (error) { 
      alert("Gagal download"); 
    } finally { 
      setIsDownloading(false); 
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-lg font-bold text-gray-800">Riwayat Data Sensor & Dosing</h2>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={handleDownloadCSV} 
            disabled={isDownloading}
            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-semibold text-xs flex items-center gap-2 border border-blue-200 disabled:opacity-50"
          >
            <FiDownload /> CSV
          </button>
          <button 
            onClick={() => onDeleteFiltered(30)}
            className="px-4 py-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 font-semibold text-xs flex items-center gap-2 border border-yellow-200"
          >
            <FiTrash2 /> &gt;30 Hari
          </button>
          <button 
            onClick={onDeleteAll}
            className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-semibold text-xs flex items-center gap-2 border border-red-200"
          >
            <FiTrash2 /> Semua
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Waktu</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">TDS (PPM)</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Suhu (°C)</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Pompa A</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Pompa B</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 text-sm">
            {isLoading ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center">
                  <div className="flex justify-center items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <span className="text-gray-500">Memuat data...</span>
                  </div>
                </td>
              </tr>
            ) : data.length > 0 ? (
              data.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{formatDate(row.createdAt)}</div>
                    <div className="text-xs text-gray-500">{formatTime(row.createdAt)}</div>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-700">{parseFloat(row.tds_air).  toFixed(0)}</td>
                  <td className="px-6 py-4 text-gray-600">{parseFloat(row.suhu_air). toFixed(1)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${row.pompa_a_status === 'ON' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {row.  pompa_a_status || 'OFF'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${row.pompa_b_status === 'ON' ? 'bg-cyan-100 text-cyan-700' : 'bg-gray-100 text-gray-500'}`}>
                      {row. pompa_b_status || 'OFF'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-400 italic">Belum ada data terekam. </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center mt-4 gap-2">
        <button 
          onClick={() => onPageChange(currentPage - 1)} 
          disabled={currentPage === 1} 
          className="p-2 rounded border hover:bg-gray-50 disabled:opacity-50"
        >
          <FiChevronLeft/>
        </button>
        <span className="py-2 text-sm text-gray-600">Hal {currentPage} / {totalPages}</span>
        <button 
          onClick={() => onPageChange(currentPage + 1)} 
          disabled={currentPage === totalPages} 
          className="p-2 rounded border hover:bg-gray-50 disabled:opacity-50"
        >
          <FiChevronRight/>
        </button>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---

const DosingDashboard = ({ deviceId }) => {
  const [tds, setTds] = useState(0);
  const [suhu, setSuhu] = useState(0);
  const [statusPompaA, setStatusPompaA] = useState({ value: 'Non-Aktif', statusInfo: { text: 'Standby', color: 'gray' } });
  const [statusPompaB, setStatusPompaB] = useState({ value: 'Non-Aktif', statusInfo: { text: 'Standby', color: 'gray' } });
  const [chartSeriesData, setChartSeriesData] = useState([]); 
  const [isChartLoading, setIsChartLoading] = useState(true);
  const [settings, setSettings] = useState({});
  const [historicalData, setHistoricalData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // Initial Fetch (Settings & Chart)
  useEffect(() => {
    if(!  deviceId) return;
    const fetchData = async () => {
      try {
        const resSettings = await api.get(`/alat/${deviceId}/dosing-settings`, { withCredentials: true });
        setSettings(resSettings.data || {});

        const resChart = await api.  get(`/alat/${deviceId}/dosing-chart`, { withCredentials: true });
        const chartData = resChart.data.  reverse();
        
        const tdsSeries = chartData.map(d => [new Date(d.createdAt).  getTime(), d.tds_air]);
        const suhuSeries = chartData.map(d => [new Date(d.createdAt). getTime(), d.suhu_air]);
        
        setChartSeriesData([
          { name: 'TDS (PPM)', data: tdsSeries },
          { name: 'Suhu (°C)', data: suhuSeries }
        ]);
        setIsChartLoading(false);
      } catch (err) { 
        console.error(err); 
      }
    };
    fetchData();
  }, [deviceId]);

  // Fetch History & Sync Switch Status
  useEffect(() => {
    if(! deviceId) return;
    const fetchHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const res = await api.get(`/alat/${deviceId}/dosing-data?  page=${currentPage}&limit=10`, { withCredentials: true });
        const fetchedData = res.data. data;
        setHistoricalData(fetchedData);
        setTotalPages(res.data.totalPages);

        if (currentPage === 1 && fetchedData.length > 0) {
          const latestData = fetchedData[0];
          
          if (latestData.pompa_a_status === "ON") {
            setStatusPompaA({ value: 'Aktif', statusInfo: { text: 'Dosing', color: 'green' } });
          } else {
            setStatusPompaA({ value: 'Non-Aktif', statusInfo: { text: 'Standby', color: 'gray' } });
          }

          if (latestData.pompa_b_status === "ON") {
            setStatusPompaB({ value: 'Aktif', statusInfo: { text: 'Dosing', color: 'green' } });
          } else {
            setStatusPompaB({ value: 'Non-Aktif', statusInfo: { text: 'Standby', color: 'gray' } });
          }
        }
      } catch (err) { 
        console.error(err); 
      } finally { 
        setIsLoadingHistory(false); 
      }
    };
    fetchHistory();
  }, [deviceId, currentPage, refetchTrigger]);

  // Socket IO Listener
  useEffect(() => {
    const socketInstance = io("http://localhost:5000"); 
    
    socketInstance.on("connect", () => {
      console.  log("Terhubung ke WebSocket");
    });

    socketInstance.on("update_tds", (payload) => setTds(parseFloat(payload.value).  toFixed(0)));
    socketInstance.on("update_suhu", (payload) => setSuhu(parseFloat(payload.value). toFixed(1)));
    
    socketInstance.on("update_pompa_a", (status) => {
      console.log("Update Status Pompa A:", status);
      const isOny = (status === 'ON' || status === "1"); 
      setStatusPompaA(isOny
        ? { value: 'Aktif', statusInfo: { text: 'Dosing', color: 'green' } } 
        : { value: 'Non-Aktif', statusInfo: { text: 'Standby', color: 'gray' } });
    });
    
    socketInstance.on("update_pompa_b", (status) => {
      console.  log("Update Status Pompa B:", status);
      const isOny = (status === 'ON' || status === "1");
      setStatusPompaB(isOny 
        ? { value: 'Aktif', statusInfo: { text: 'Dosing', color: 'green' } } 
        : { value: 'Non-Aktif', statusInfo: { text: 'Standby', color: 'gray' } });
    });

    socketInstance.on("new_dosing_data", () => setRefetchTrigger(prev => prev + 1));
    
    return () => socketInstance.disconnect();
  }, [deviceId]);

  // Handlers
  const handlePumpControl = async (target, state) => {
    const previousStateA = statusPompaA;
    const previousStateB = statusPompaB;

    const newStateObj = state === 'ON' 
      ?  { value: 'Aktif', statusInfo: { text: 'Dosing', color: 'green' } }
      : { value: 'Non-Aktif', statusInfo: { text: 'Standby', color: 'gray' } };

    if (target === 'pumpA') setStatusPompaA(newStateObj);
    else if (target === 'pumpB') setStatusPompaB(newStateObj);

    const valueToSend = state === 'ON' ?   "1" : "0";
    try {
      await api.post(`/alat/${deviceId}/dosing-manual`, { 
        target: target, 
        value: valueToSend 
      }, { withCredentials: true });
    } catch (err) {
      console.error("Gagal kontrol pompa:", err);
      if (target === 'pumpA') setStatusPompaA(previousStateA);
      else if (target === 'pumpB') setStatusPompaB(previousStateB);
      alert(`Gagal mengubah status pompa.  `);
    }
  };

  const handleDeleteAll = async () => { 
    if(confirm("Hapus semua?  ")) { 
      await api.delete(`/alat/${deviceId}/dosing-data`, { withCredentials: true }); 
      setRefetchTrigger(p=>p+1); 
    }
  };

  const handleDeleteFiltered = async (days) => { 
    if(confirm(`Hapus > ${days} hari? `)) { 
      await api.delete(`/alat/${deviceId}/dosing-data/filtered`, { data: { days }, withCredentials: true }); 
      setRefetchTrigger(p=>p+1); 
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* 1. Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="TDS" value={tds} unit="PPM" icon={<FaCrosshairs />} statusInfo={{ text: 'Real time', color: 'blue' }} />
        <StatCard title="Suhu" value={suhu} unit="°C" icon={<FaThermometerHalf />} statusInfo={{ text: 'Real time', color: 'blue' }} />
        <StatCard title="Pompa A" value={statusPompaA.  value} icon={<FaTint className="text-green-600" />} statusInfo={statusPompaA.statusInfo} />
        <StatCard title="Pompa B" value={statusPompaB. value} icon={<FaTint className="text-cyan-600" />} statusInfo={statusPompaB.statusInfo} />
      </div>

      {/* 2. Middle Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Kiri: Kontrol Manual & Settings (2 kolom) */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <DosingManualControlCard 
            statusPompaA={statusPompaA} 
            statusPompaB={statusPompaB} 
            onControl={handlePumpControl} 
          />
          <SettingsDisplayCard settings={settings} />
        </div>

        {/* Kanan: Chart (3 kolom) */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full min-h-[450px] flex flex-col">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Grafik Real-time</h3>
            {isChartLoading ? (
              <div className="flex-grow flex flex-col items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-500">Memuat Grafik...</span>
              </div>
            ) : (
              chartSeriesData && chartSeriesData.length > 0 ? (
                <div className="flex-grow">
                  <RealtimeApexChart
                    chartId="dosing-realtime"
                    series={chartSeriesData}
                    title="Monitoring PPM & Suhu"
                    yAxis={[
                      { seriesName: 'TDS (PPM)', title: 'PPM' },
                      { seriesName: 'Suhu (°C)', title: '°C', opposite: true }
                    ]}
                    colors={['#10B981', '#3B82F6']} 
                  />
                </div>
              ) : (
                <div className="flex-grow flex items-center justify-center text-gray-400">
                  <FaInfoCircle className="mr-2" />
                  Data grafik belum tersedia
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* 3. Bottom Section (Table) */}
      <DosingDataTable 
        data={historicalData}
        isLoading={isLoadingHistory}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onDeleteAll={handleDeleteAll}
        onDeleteFiltered={handleDeleteFiltered}
        deviceId={deviceId}
      />
    </div>
  );
};

export default DosingDashboard;