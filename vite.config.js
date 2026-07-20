import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
  server: {
    port: 5173,
    open: false,
    // 所有 /api 请求统一转发到后端服务（localhost:3002）
    // 后端负责 AI API 代理、限流、缓存、Key 管理
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
    },
  }
})
