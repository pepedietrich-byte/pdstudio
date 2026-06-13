import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // In local dev, proxy /api/executions directly to n8n
      '/api/executions': {
        target: process.env.VITE_N8N_BASE_URL || 'https://n8n.srv1736252.hstgr.cloud',
        changeOrigin: true,
        rewrite: (path) => {
          const params = path.replace('/api/executions', '')
          return `/api/v1/executions${params}`
        },
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            const key = process.env.VITE_N8N_API_KEY || ''
            if (key) proxyReq.setHeader('X-N8N-API-KEY', key)
          })
        },
      },
    },
  },
})
