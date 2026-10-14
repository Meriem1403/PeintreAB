import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Les requêtes /api passent par Vite → backend. On retire Origin pour éviter
// le rejet CORS Express (le navigateur voit déjà du same-origin sur le domaine).
const apiProxy = {
  target: 'http://backend:3000',
  changeOrigin: true,
  configure: (proxy) => {
    proxy.on('proxyReq', (proxyReq) => {
      proxyReq.removeHeader('origin')
      proxyReq.removeHeader('Origin')
    })
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  appType: 'spa',
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/api': apiProxy,
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        ...apiProxy,
        target: 'http://localhost:3000',
      },
    },
  },
})
