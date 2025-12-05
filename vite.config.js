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
  host: true,
  proxy: {
      // Semua permintaan yang dimulai dengan /api akan diteruskan ke backend
      '/api': {
        target: `http://localhost:3020`, // Ganti dengan alamat backend Anda
        changeOrigin: true, // Diperlukan agar proxy berjalan dengan baik
        rewrite: (path) => path.replace(/^\/api/, ''), // Hapus /api sebelum dikirim ke backend
      }
    }
}
})
