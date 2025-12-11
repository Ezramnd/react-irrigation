import React, { useState, useEffect } from 'react';
import Chart from 'react-apexcharts';

const SmartIrrigationChart = () => {
  // State untuk konfigurasi chart
  const [options, setOptions] = useState({
    chart: {
      id: 'smart-irrigation-chart',
      toolbar: {
        show: true, // Tampilkan toolbar agar bisa zoom
      },
    },
    xaxis: {
      type: 'datetime',
      tooltip: {
        enabled: true,
      },
      labels: {
        datetimeUTC: false, // Tampilkan waktu sesuai zona waktu lokal
      }
    },
    yaxis: {
      min: 0,
      max: 120, // Beri sedikit ruang di atas nilai 100
      labels: {
        formatter: function (val) {
          // Ganti label angka menjadi status
          if (val >= 100) return "ON";
          if (val === 0) return "OFF";
          return '';
        }
      }
    },
    tooltip: {
      x: {
        format: 'dd MMM yyyy - HH:mm' // Format tanggal dan waktu di tooltip
      },
      y: {
        formatter: function(val) {
          return val >= 100 ? 'Watering' : 'Idle';
        }
      }
    },
    stroke: {
      curve: 'stepline', // 'stepline' cocok untuk status on/off
    },
    title: {
      text: 'Riwayat Aktivitas Pompa Irigasi (30 Hari Terakhir)',
      align: 'left'
    },
  });

  // State untuk data chart
  const [series, setSeries] = useState([
    {
      name: 'Status Pompa',
      data: [] // Data awal kosong, akan diisi oleh useEffect
    }
  ]);

  /**
   * Fungsi untuk menghasilkan data simulasi irigasi.
   * Aturan: Menyiram setiap 3 hari sekali, selama 15 menit.
   * @param {number} days - Jumlah hari ke belakang untuk disimulasikan.
   * @returns {Array} - Array data untuk series ApexCharts.
   */
  const generateIrrigationData = (days) => {
    const data = [];
    const now = new Date();
    const wateringDurationMinutes = 15;

    // Mulai dari 'days' hari yang lalu
    let currentDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Tambahkan titik awal untuk memastikan grafik mulai dari 'OFF'
    data.push({ x: currentDate.getTime(), y: 0 });

    let dayCounter = 0;
    while (currentDate <= now) {
      // Cek apakah ini hari penyiraman (setiap 3 hari)
      if (dayCounter % 3 === 0) {
        // Asumsikan penyiraman dimulai jam 8 pagi
        const wateringStartTime = new Date(currentDate);
        wateringStartTime.setHours(8, 0, 0, 0);

        const wateringEndTime = new Date(wateringStartTime.getTime() + wateringDurationMinutes * 60 * 1000);
        
        // Hanya tambahkan data jika waktu penyiraman belum lewat hari ini
        if (wateringStartTime < now) {
            // Titik sebelum ON (untuk stepline)
            data.push({ x: wateringStartTime.getTime() - 1, y: 0 });
            // Titik saat ON
            data.push({ x: wateringStartTime.getTime(), y: 100 });
            // Titik saat akan OFF
            data.push({ x: wateringEndTime.getTime(), y: 100 });
            // Titik setelah OFF
            data.push({ x: wateringEndTime.getTime() + 1, y: 0 });
        }
      }

      // Lanjut ke hari berikutnya
      currentDate.setDate(currentDate.getDate() + 1);
      dayCounter++;
    }
    
    // Pastikan titik terakhir adalah 'OFF' di waktu sekarang
    data.push({ x: now.getTime(), y: 0 });

    return data;
  };

  useEffect(() => {
    // Hasilkan data untuk 30 hari terakhir
    const simulatedData = generateIrrigationData(30);
    setSeries([{ data: simulatedData }]);
    
    // useEffect ini hanya perlu berjalan sekali saat komponen dimuat
  }, []); 

  return (
    <Chart
      options={options}
      series={series}
      type="line"
      height={350}
    />
  );
};

// Tambahkan default props untuk mencegah crash: series = []
const RealtimeApexChart = React.memo(({ 
    series = [],         // Ubah dari 'seriesData' menjadi 'series' agar sinkron dengan parent
    chartId,             // Terima ID dinamis
    colors,              // Terima warna dinamis
    yAxis,               // Terima konfigurasi Y-Axis dinamis
    title                // Terima judul dinamis (opsional)
}) => {

  const defaultOptions = {
    chart: {
      id: chartId || 'realtime-chart', // Gunakan ID dari props
      height: 350,
      toolbar: {
        show: true,
        autoSelected: 'zoom'
      },
      animations: {
        enabled: true,
        easing: 'linear',
        dynamicAnimation: {
          speed: 1000
        }
      }
    },
    // Gunakan warna dari props, atau fallback ke default biru/hijau
    colors: colors || ['#008FFB', '#00E396'], 
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: [3, 2]
    },
    fill: {
      type: 'gradient',
      gradient: {
        opacityFrom: 0.6,
        opacityTo: 0.1,
      }
    },
    legend: {
      position: 'top',
      horizontalAlign: 'center'
    },
    xaxis: {
      type: 'datetime',
      labels: {
        datetimeUTC: false,
        format: 'HH:mm:ss'
      },
      tooltip: {
        enabled: false
      }
    },
    // === BAGIAN KRUSIAL: Y-AXIS DINAMIS ===
    yaxis: yAxis ? yAxis.map((axis) => ({
        seriesName: axis.seriesName,
        opposite: axis.opposite || false,
        min: axis.min, // Biarkan auto jika undefined
        max: axis.max, // Biarkan auto jika undefined
        title: {
            text: axis.title || axis.seriesName
        },
        labels: {
            formatter: (val) => val ? val.toFixed(1) : val
        }
    })) : [
        // Fallback default jika props yAxis tidak dikirim (misal untuk Climate lama)
        { title: { text: "Value 1" } },
        { opposite: true, title: { text: "Value 2" } }
    ],
    tooltip: {
      x: {
        format: 'dd MMM - HH:mm:ss'
      },
      // Tooltip dinamis mengikuti yAxis
      y: {
          formatter: (val) => val ? val.toFixed(2) : '--'
      }
    },
    title: {
        text: title || '',
        align: 'left',
        style: { fontSize: '14px' }
    }
  };

  return (
    <Chart
      options={defaultOptions}
      // Pastikan series selalu berupa Array. Jika null/undefined, ganti jadi []
      series={Array.isArray(series) ? series : []}
      type="line"
      height={350}
    />
  );
});

export default RealtimeApexChart;