import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
  proxy: {
    // Daftarkan semua rute utama yang ingin di-proxy
    '/login': 'http://localhost:5000',
    '/logout': 'http://localhost:5000',
    '/token': 'http://localhost:5000',
    '/me': 'http://localhost:5000',
    '/users': 'http://localhost:5000',
    '/alat': 'http://localhost:5000',
    '/jadwal': 'http://localhost:5000',
    '/forgot-password': 'http://localhost:5000',
    '/reset-password': 'http://localhost:5000',
  }
}
})
