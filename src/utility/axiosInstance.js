/**
 * axiosInstance.js
 *
 * Handles Zoho API authentication with automatic token caching and refresh.
 * If token is expired or Zoho returns 1030, automatically refreshes via Zoho Accounts
 * or Catalyst token manager and retries the request.
 */

import axios from 'axios';
import { storeData, getData } from './LocalStorageService';
import { client_id, client_secret, grant_type, refresh_token } from '../constants/appconstant';

const TOKEN_URL = '/server/zohoTokenManager_COBNB';
const TOKEN_CACHE_DURATION_MS = 40 * 60 * 1000; // 40 minutes (Zoho tokens last 60 minutes)

let isRefreshing = false;
let refreshQueue = [];

const processQueue = (token) => {
  refreshQueue.forEach((resolve) => resolve(token));
  refreshQueue = [];
};

// Directly fetch a fresh token from Zoho Accounts via OAuth refresh token
export const fetchDirectZohoToken = async () => {
  try {
    const res = await axios.post(
      `/zoho-accounts/oauth/v2/token?refresh_token=${refresh_token}&client_id=${client_id}&client_secret=${client_secret}&grant_type=${grant_type}`,
      {},
      { timeout: 10000 }
    );
    const token = res?.data?.access_token;
    if (token) {
      await storeData('refreshToken', token);
      await storeData('refreshTokenTimestamp', Date.now().toString());
      return token;
    }
  } catch (err) {
    console.error('[Token] Direct Zoho Accounts refresh failed:', err?.message);
  }
  return null;
};

// Fetch from Catalyst serverless token manager
const fetchCatalystToken = async () => {
  try {
    const res = await axios.get(TOKEN_URL, { timeout: 8000 });
    const token = res?.data?.access_token;
    if (token) {
      await storeData('refreshToken', token);
      await storeData('refreshTokenTimestamp', Date.now().toString());
      return token;
    }
  } catch (err) {
    console.warn('[Token] Catalyst token manager failed or timed out:', err?.message);
  }
  return null;
};

export const fetchFreshToken = async (forceRefresh = false) => {
  if (!forceRefresh) {
    try {
      const cachedToken = await getData('refreshToken');
      const timestampStr = await getData('refreshTokenTimestamp');
      const timestamp = timestampStr ? parseInt(timestampStr, 10) : 0;
      const isFresh = cachedToken && (Date.now() - timestamp < TOKEN_CACHE_DURATION_MS);
      if (isFresh) {
        return cachedToken;
      }
    } catch {
      // ignore local storage read errors
    }
  }

  if (isRefreshing) {
    return new Promise((resolve) => refreshQueue.push(resolve));
  }
  isRefreshing = true;

  try {
    // Attempt direct refresh from Zoho Accounts first (fast & always accurate)
    let token = await fetchDirectZohoToken();
    if (!token) {
      // Fallback to Catalyst
      token = await fetchCatalystToken();
    }
    if (token) {
      processQueue(token);
      return token;
    }
  } finally {
    isRefreshing = false;
  }

  // Final fallback: try any stored token
  return (await getData('refreshToken')) || null;
};

const zohoAxios = axios.create();

// ── REQUEST: Attach Authorization header ─────────────────────────────────────
zohoAxios.interceptors.request.use(
  async (config) => {
    const token = await fetchFreshToken();
    if (token) {
      config.headers['Authorization'] = `Zoho-oauthtoken ${token}`;
    }
    if (!config.headers['Accept']) {
      config.headers['Accept'] = 'application/json';
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── RESPONSE: Retry once on Zoho 1030 token error ────────────────────────────
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
        console.warn('[Token] 1030 detected. Refreshing token directly from Zoho Accounts...');
        const freshToken = await fetchDirectZohoToken();
        if (freshToken) {
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
