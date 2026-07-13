import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import store, { persistor } from './redux/store'
import './index.css'
import App from './App.jsx'
import axios from 'axios'

if (import.meta.env.PROD) {
  axios.interceptors.request.use(config => {
    if (config.url.startsWith('/zoho-api')) {
      config.url = config.url.replace(/^\/zoho-api/, 'https://creator.zoho.com');
    } else if (config.url.startsWith('/zoho-accounts')) {
      config.url = config.url.replace(/^\/zoho-accounts/, 'https://accounts.zoho.com');
    } else if (config.url.startsWith('/catalyst-token')) {
      config.url = 'https://cobnb-909749525.catalystserverless.com' + config.url;
    }
    return config;
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <BrowserRouter basename="/cobnb/">
          <App />
        </BrowserRouter>
      </PersistGate>
    </Provider>
  </StrictMode>,
)
