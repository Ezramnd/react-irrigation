// 1. Impor 'Routes', bukan 'Switch'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AlatPage from './pages/AlatPage';
import EspPage from './pages/EspPage';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import UsersPage from './pages/UsersPage';
import AdminRoute from './components/AdminRoute';

function App() {
  return (
    <BrowserRouter>
      {/* 2. Gunakan <Routes> sebagai pembungkus */}
      <Routes>

         {/* --- Rute Publik (Hanya untuk yang BELUM login) --- */}
        <Route element={<PublicRoute />}>
          <Route path="/" element={<LoginPage />} />
        </Route>

        {/* --- Rute yang Dilindungi (Hanya untuk yang SUDAH login) --- */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/alat" element={<AlatPage />} />
        </Route>
        <Route element={<AdminRoute />}>
          <Route path="/users" element={<UsersPage />} />
          {/* Tambahkan rute lain khusus admin di sini */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
