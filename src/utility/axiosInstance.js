/**
 * axiosInstance.js
 *
 * Calls the Catalyst token manager BEFORE every Zoho API request.
 * Token is cached in localStorage. On 1030, retries with a fresh token.
 */

import axios from 'axios';
import { storeData, getData } from './LocalStorageService';

const TOKEN_URL = 'https://cobnb-909749525.catalystserverless.com/server/zohoTokenManager_COBNB';

// Deduplicate simultaneous token fetches
let isRefreshing = false;
let refreshQueue = [];

const processQueue = (token) => {
  refreshQueue.forEach((resolve) => resolve(token));
  refreshQueue = [];
};

const fetchFreshToken = async () => {
  if (isRefreshing) {
    return new Promise((resolve) => refreshQueue.push(resolve));
  }
  isRefreshing = true;
  try {
    const res = await axios.get(TOKEN_URL);
    const token = res?.data?.access_token;
    if (token) {
      await storeData('refreshToken', token);
      processQueue(token);
      return token;
    }
    console.warn('[Token] Unexpected response:', res?.data);
  } catch (err) {
    console.error('[Token] Fetch failed:', err?.message);
  } finally {
    isRefreshing = false;
  }
  // Fallback: try localStorage if fetch failed
  return await getData('refreshToken') || null;
};

const zohoAxios = axios.create();

// ── REQUEST: always fetch fresh token first ───────────────────────────────────
zohoAxios.interceptors.request.use(
  async (config) => {
    const token = await fetchFreshToken();
    if (token) {
      config.headers['Authorization'] = `Zoho-oauthtoken ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── RESPONSE: retry once on Zoho 1030 token error ────────────────────────────
zohoAxios.interceptors.response.use(
  (response) => {
    if (response?.data?.code === 1030) {
      return Promise.reject({ response, _isTokenError: true, config: response.config });
    }
    return response;
  },
  async (error) => {
    const originalRequest = error?.config || error?.response?.config;
    const isTokenError =
      error?._isTokenError || error?.response?.data?.code === 1030;

    if (isTokenError && originalRequest && !originalRequest._retried) {
      originalRequest._retried = true;
      try {
        const freshToken = await axios.get(TOKEN_URL).then(r => r?.data?.access_token);
        if (freshToken) {
          await storeData('refreshToken', freshToken);
          originalRequest.headers['Authorization'] = `Zoho-oauthtoken ${freshToken}`;
          return zohoAxios(originalRequest);
        }
      } catch (retryErr) {
        console.error('[Token] Retry fetch failed:', retryErr?.message);
      }
    }

    return Promise.reject(error);
  }
);

export default zohoAxios;
