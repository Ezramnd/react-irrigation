// src/components/RealtimeApexChart.jsx

import React from 'react'; // Impor 'React' untuk React.memo
import Chart from 'react-apexcharts';

// --- [PERBAIKAN] Bungkus seluruh komponen dengan React.memo ---
const RealtimeApexChart = React.memo(({ seriesData }) => {
  // Pesan ini sekarang hanya akan muncul sekali saat load
  console.log("Render RealtimeApexChart (INI HARUSNYA JARANG MUNCUL)"); 

   const options = {
      chart: {
      id: 'climate-sensor-chart', // ID ini PENTING
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
      colors: ['#008FFB', '#00E396'], 
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
      markers: {
      size: 0,
      hover: {
            size: 5
      }
      },
      xaxis: {
      type: 'datetime',
      labels: {
            datetimeUTC: false,
        format: 'HH:mm'
      },
      tooltip: {
        enabled: false
      }
      },
      yaxis: [
      {
            seriesName: 'Suhu',
            title: {
               text: "Suhu (°C)",
            },
            min: 15, 
            max: 45,
            labels: {
               formatter: (val) => val.toFixed(1)
            }
      },
      {
            seriesName: 'Kelembaban',
            opposite: true, 
            title: {
               text: "Kelembaban (%)"
            },
            min: 0,
            max: 100,
            labels: {
               formatter: (val) => val.toFixed(0)
            }
      }
      ],
      tooltip: {
      x: {
            format: 'dd MMM - HH:mm:ss'
      },
      y: [
            {
               title: {
               formatter: (seriesName) => `${seriesName}:`
               },
               formatter: (val) => val ? `${val.toFixed(2)} °C` : '--'
            },
            {
               title: {
               formatter: (seriesName) => `${seriesName}:`
               },
               formatter: (val) => val ? `${val.toFixed(2)} %` : '--'
            }
      ]
      },
   };
   
   return (
      <Chart
      options={options}
      series={seriesData}
      height={350}
      />
   );
}); // --- [PERBAIKAN] Akhir dari React.memo ---

export default RealtimeApexChart;