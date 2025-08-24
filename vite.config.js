import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // 保持后端的 /api 前缀不被移除，直接透传
      },
      '/system': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // 静态上传资源由后端暴露 /uploads/**，开发环境通过代理转发
      '/uploads': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    },
  },
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      }
    }
  }
})
