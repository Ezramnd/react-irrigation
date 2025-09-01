import { useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
// Anda bisa menghapus import './App.css' setelah semua styling diubah

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4 sm:p-8">
      <div className="flex justify-center items-center space-x-6 sm:space-x-8 mb-8">
        <a href="https://vitejs.dev" target="_blank" rel="noreferrer">
          <img 
            src={viteLogo} 
            className="w-20 h-20 sm:w-24 sm:h-24 p-4 transition-transform duration-300 hover:scale-110" 
            alt="Vite logo" 
          />
        </a>
        <a href="https://react.dev" target="_blank" rel="noreferrer">
          <img 
            src={reactLogo} 
            className="w-20 h-20 sm:w-24 sm:h-24 p-4 transition-transform duration-300 hover:scale-110 motion-safe:animate-spin" 
            alt="React logo" 
          />
        </a>
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold text-gray-100 mb-6">
        Vite + React
      </h1>

      <div className="bg-gray-800 p-6 sm:p-8 rounded-lg shadow-xl text-center w-full max-w-sm">
        <button
          className="bg-blue-600 text-white font-semibold py-2 px-6 rounded-full shadow-md transition-colors duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          onClick={() => setCount((count) => count + 1)}
        >
          count is {count}
        </button>

        <p className="mt-4 text-sm text-gray-400">
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>

      <p className="mt-8 text-xs text-gray-500">
        Click on the Vite and React logos to learn more
      </p>
    </div>
  );
}

export default App;