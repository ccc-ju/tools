import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://www.apple.com',
        changeOrigin: true,
        rewrite: (path) => {
          // 直接转发到苹果API
          if (path.includes('/api/stock/')) {
            return path.replace('/api/stock', '/hk-zh/shop/fulfillment-messages')
          }
          if (path.includes('/api/pickup/')) {
            return path.replace('/api/pickup', '/hk-zh/shop/pickup-message-recommendations')
          }
          return path
        },
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // 添加必要的headers
            proxyReq.setHeader('accept', '*/*')
            proxyReq.setHeader('accept-language', 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6')
            proxyReq.setHeader('cache-control', 'no-cache')
            proxyReq.setHeader('pragma', 'no-cache')
            proxyReq.setHeader('referer', 'https://www.apple.com/hk-zh/shop/buy-iphone/iphone-17-pro')
            proxyReq.setHeader('user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36')
            proxyReq.setHeader('sec-fetch-dest', 'empty')
            proxyReq.setHeader('sec-fetch-mode', 'cors')
            proxyReq.setHeader('sec-fetch-site', 'same-origin')
            // 添加重要的Cookie
            proxyReq.setHeader('cookie', 'pltvcid=undefined; dssf=1; geo=CN; s_cc=true; dslang=HK-ZH; site=HKG; rtsid=%7BHK%3D%7Bt%3Da%3Bi%3DR409%3B%7D%3B%7D')
          })
        }
      }
    }
  }
})