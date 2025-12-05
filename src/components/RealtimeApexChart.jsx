// src/components/RealtimeApexChart.jsx

import React from 'react';
import Chart from 'react-apexcharts';

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