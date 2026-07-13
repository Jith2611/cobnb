import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/zoho-api': {
        target: 'https://creator.zoho.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/zoho-api/, ''),
      },
      '/zoho-accounts': {
        target: 'https://accounts.zoho.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/zoho-accounts/, ''),
      },
      '/catalyst-token': {
        target: 'https://cobnb-909749525.catalystserverless.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => '/server/zohoTokenManager_COBNB',
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Origin', 'https://cobnb-909749525.catalystserverless.com');
          });
        },
      },
    }
  }
})


