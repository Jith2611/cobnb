import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import https from 'node:https'

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

const httpsAgent = new https.Agent({
  keepAlive: false,
  rejectUnauthorized: false,
});

const handleProxyError = (proxy) => {
  proxy.on('error', (err, req, res) => {
    console.warn(`[vite proxy error] ${req?.url || ''}:`, err?.message || err);
    if (res && !res.headersSent && typeof res.writeHead === 'function') {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Proxy error', message: err?.message || String(err) }));
    }
  });
};

export default defineConfig({
  plugins: [react(), paymentReturnPlugin()],
  server: {
    proxy: {
      '/zoho-api': {
        target: 'https://creator.zoho.com',
        changeOrigin: true,
        secure: false,
        agent: httpsAgent,
        headers: {
          Connection: 'close',
        },
        rewrite: (path) => path.replace(/^\/zoho-api/, ''),
        configure: handleProxyError,
      },
      '/ezee-api': {
        target: 'https://live.ipms247.com',
        changeOrigin: true,
        secure: false,
        agent: httpsAgent,
        headers: {
          Connection: 'close',
        },
        rewrite: (path) => path.replace(/^\/ezee-api/, ''),
        configure: handleProxyError,
      },
      '/zoho-accounts': {
        target: 'https://accounts.zoho.com',
        changeOrigin: true,
        secure: false,
        agent: httpsAgent,
        headers: {
          Connection: 'close',
        },
        rewrite: (path) => path.replace(/^\/zoho-accounts/, ''),
        configure: handleProxyError,
      },
      '/server': {
        target: 'https://cobnb-909749525.catalystserverless.com',
        changeOrigin: true,
        secure: false,
        agent: httpsAgent,
        headers: {
          Connection: 'close',
        },
        configure: handleProxyError,
      },
      '/catalyst-token': {
        target: 'https://cobnb-909749525.catalystserverless.com',
        changeOrigin: true,
        secure: false,
        agent: httpsAgent,
        rewrite: (path) => '/server/zohoTokenManager_COBNB',
        configure: (proxy) => {
          handleProxyError(proxy);
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Origin', 'https://cobnb-909749525.catalystserverless.com');
          });
        },
      },
    }
  }
})


