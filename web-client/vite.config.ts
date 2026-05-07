import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
		// mappings when running in dev mode
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
})
