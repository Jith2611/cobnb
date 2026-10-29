import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function paymentReturnPlugin() {
  return {
    name: 'payment-return-handler',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if ((req.url?.startsWith('/payment-return') || req.url?.startsWith('/api/payment-return')) && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            res.writeHead(303, { Location: `/payment-return?${body}` });
            res.end();
          });
          return;
        }
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), paymentReturnPlugin()],
  server: {
    proxy: {
      '/zoho-api': {
        target: 'https://creator.zoho.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/zoho-api/, ''),
      },
      '/ezee-api': {
        target: 'https://live.ipms247.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ezee-api/, ''),
      },
      '/zoho-accounts': {
        target: 'https://accounts.zoho.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/zoho-accounts/, ''),
      },
      '/server': {
        target: 'https://cobnb-909749525.catalystserverless.com',
        changeOrigin: true,
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


