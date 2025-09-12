import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import axios from 'axios';
axios.defaults.withCredentials = true;
import { AuthProvider } from './context/AuthContext'; 

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider> {/* <-- 2. Bungkus App */}
      <App />
    </AuthProvider>
  </StrictMode>,
)
