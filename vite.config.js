import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 3000, // You can change the development port if needed
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // Your backend URL
        changeOrigin: true,           // <-- VERY IMPORTANT
        secure: false,                // Set to false if backend is http
        // Rewrite the path: remove '/api' before sending to backend
        // e.g., frontend requests /api/greet -> backend receives /greet
        rewrite: (path) => path.replace(/^\/api/, ''),
      }
    }
  }
})
