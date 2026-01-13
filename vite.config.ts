// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  base: '/th8-dcc-frontend-v1/', 
  
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // ✅ เพิ่มส่วนนี้เข้าไปครับ
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000', // Port ของ FastAPI
        changeOrigin: true,
        secure: false,
        // ⚠️ สำคัญ: ไม่ต้องใส่ rewrite เพราะ Backend คุณมี prefix /api อยู่แล้ว
      }
    }
  }
})