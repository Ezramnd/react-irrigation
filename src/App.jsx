// 1. Impor 'Routes', bukan 'Switch'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AlatPage from './pages/AlatPage';

function App() {
  return (
    <BrowserRouter>
      {/* 2. Gunakan <Routes> sebagai pembungkus */}
      <Routes>
        {/* 3. Gunakan prop 'element' untuk merender komponen. 'exact' tidak perlu lagi. */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/alat" element={<AlatPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
