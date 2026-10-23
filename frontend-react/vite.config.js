import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Local Django API defaults to HTTP. Override for a different local backend if needed.
// eslint-disable-next-line no-undef
const djangoTarget = process.env.DJANGO_API_URL || 'http://127.0.0.1:8000'
const djangoProxy = {
  target: djangoTarget,
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
