import React from 'react';
import Papa from 'papaparse'; // Untuk CSV
import * as XLSX from 'xlsx'; // Untuk Excel

const DownloadableIrrigationTable = ({ history }) => {

  // Fungsi untuk handle download CSV
  const handleDownloadCSV = () => {
    // Ubah nama kolom agar lebih ramah di file unduhan
    const formattedData = history.map(item => ({
      'Tanggal': item.date,
      'Waktu Mulai': item.startTime,
      'Waktu Selesai': item.endTime,
      'Durasi (menit)': item.duration.replace(' menit', ''),
    }));

    const csv = Papa.unparse(formattedData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'riwayat_irigasi.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fungsi untuk handle download Excel (XLS)
  const handleDownloadXLS = () => {
    const formattedData = history.map(item => ({
      'Tanggal': item.date,
      'Waktu Mulai': item.startTime,
      'Waktu Selesai': item.endTime,
      'Durasi (menit)': item.duration.replace(' menit', ''),
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Riwayat Irigasi');
    XLSX.writeFile(workbook, 'riwayat_irigasi.xlsx');
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-800">Riwayat Penyiraman</h2>
        {/* Tombol Download */}
        <div className="flex space-x-2">
          <button
            onClick={handleDownloadCSV}
            className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Download CSV
          </button>
          <button
            onClick={handleDownloadXLS}
            className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Download XLS
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left text-gray-700">
          {/* ... isi tabel dari jawaban sebelumnya ... */}
          <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
            <tr>
              <th scope="col" className="px-6 py-3">No</th>
              <th scope="col" className="px-6 py-3">Tanggal</th>
              <th scope="col" className="px-6 py-3">Waktu Mulai (ON)</th>
              <th scope="col" className="px-6 py-3">Waktu Selesai (OFF)</th>
            </tr>
          </thead>
          <tbody>
            {history.length > 0 ? (
              history.map((item, index) => (
                <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4">{index + 1}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{item.date}</td>
                  <td className="px-6 py-4 text-green-600">{item.startTime}</td>
                  <td className="px-6 py-4 text-red-600">{item.endTime}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center py-4">Tidak ada riwayat penyiraman.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DownloadableIrrigationTable;