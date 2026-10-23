import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const djangoProxy = {
  target: process.env.DJANGO_API_URL || 'http://127.0.0.1:8000',
  changeOrigin: true,
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': djangoProxy,
      '/writing': djangoProxy,
      '/vocabulary': djangoProxy,
      '/reading': djangoProxy,
      '/quiz': djangoProxy,
      '/learning': djangoProxy,
    },
  },
})
