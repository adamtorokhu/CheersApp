import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Listen on all local IPs
    allowedHosts: [
      'cc241054-10698.node.fhstp.cc' // No protocol, just the hostname
    ],
    proxy: {
      // Proxy API requests to backend in development to avoid CORS and allow SameSite=lax cookies
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  }
})
