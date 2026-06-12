/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
	base: '/team-devsecops/',
	plugins: [react(), tailwindcss()],
	test: {
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./tests/setup.ts'],
		css: false,
		include: ['tests/**/*.test.{ts,tsx}'],
		exclude: ['tests/e2e/**', 'node_modules/**', 'dist/**'],
		reporters: [
			'default',
			['junit', { outputFile: 'test-results/vitest-junit.xml' }],
		],
		coverage: {
			reporter: ['text', 'json-summary', 'json'],
			reportOnFailure: true,
		},
	},
	server: {
		// mappings when running in dev mode
		proxy: {
			'/api': {
				target: process.env.VITE_API_PROXY ?? 'http://localhost:8080',
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
