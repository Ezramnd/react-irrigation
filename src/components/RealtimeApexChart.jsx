import React, { useState, useEffect } from 'react';
import Chart from 'react-apexcharts';

const RealtimeApexChart = () => {
  // ApexCharts memisahkan konfigurasi (options) dan data (series)
  const [options, setOptions] = useState({
    chart: {
      id: 'realtime',
      animations: {
        enabled: true,
        easing: 'linear',
        dynamicAnimation: {
          speed: 1000 // Kecepatan update animasi dalam milidetik
        }
      },
      toolbar: {
        show: false
      },
      zoom: {
        enabled: false
      }
    },
    xaxis: {
      type: 'datetime',
      range: 60000, // Menampilkan data untuk 60 detik terakhir
    },
    yaxis: {
      max: 100 // Nilai maksimal untuk sumbu Y
    },
    stroke: {
      curve: 'smooth'
    },
    markers: {
      size: 0
    },
  });

  const [series, setSeries] = useState([
    {
      name: 'Sales',
      data: [] // Data awal kosong
    }
  ]);

  useEffect(() => {
    // Fungsi untuk menghasilkan data baru
    const getNewSeries = (baseval, count) => {
      const x = baseval;
      const y = Math.floor(Math.random() * (90 - 30 + 1)) + 30; // Angka acak antara 30 dan 90
      return { x, y };
    };

    // Simulasi pembaruan data setiap 2 detik
    const interval = setInterval(() => {
      const newPoint = getNewSeries(new Date().getTime(), 1);
      
      // Ambil data yang sudah ada
      const currentData = series[0].data.slice();
      
      // Tambahkan titik data baru
      currentData.push(newPoint);

      // Pastikan data tidak terlalu banyak, hapus yang paling lama
      if (currentData.length > 20) {
        currentData.shift();
      }

      // Perbarui state series untuk me-render ulang chart
      setSeries([{ data: currentData }]);
    }, 2000); // Update setiap 2 detik

    // Membersihkan interval saat komponen tidak lagi digunakan
    return () => clearInterval(interval);
  }, [series]); // Bergantung pada 'series' untuk mendapatkan data terbaru

  return (
    <Chart
      options={options}
      series={series}
      type="line"
      height={350}
    />
  );
};

export default RealtimeApexChart;