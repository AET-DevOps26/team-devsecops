import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/team-devsecops/',
  plugins: [react(), tailwindcss()],
  server: {
		// mappings when running in dev mode
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            // Spring's CorsConfig only allows the GitHub Pages origin; strip
            // the browser's Origin so Spring skips CORS in local dev.
            proxyReq.removeHeader('origin')
          })
        },
      },
    },
  },
})
