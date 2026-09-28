/**
 * api/axiosInstance.js  (final)
 * Axios instance with queued 401 retry logic.
 * Uses registered dispatch/getState refs from initAxiosInterceptors(store).
 */

import axios from 'axios';
import { refreshSession, logout } from '@/api/authActions';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

let _dispatch = null;
let _getState = null;
let _isRefreshing = false;
let _failedQueue = [];

const processQueue = (error, token = null) => {
  _failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  _failedQueue = [];
};

/**
 * Call once from main.jsx after store is created.
 * @param {import('@reduxjs/toolkit').EnhancedStore} store
 */
export const initAxiosInterceptors = (store) => {
  _dispatch = store.dispatch;
  _getState = store.getState;

  // ── Request: inject access token ────────────────────────────────────────────
  axiosInstance.interceptors.request.use(
    (config) => {
      const token = _getState?.().auth.accessToken;
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    },
    (error) => Promise.reject(error)
  );

  // ── Response: 401 → refresh → retry ─────────────────────────────────────────
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const original = error.config;
      const isRefreshEndpoint = original?.url?.includes('/auth/refresh');
      const is401 = error.response?.status === 401;

      if (!is401 || isRefreshEndpoint || original._retried) {
        return Promise.reject(error);
      }

      if (_isRefreshing) {
        return new Promise((resolve, reject) => {
          _failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(original);
          })
          .catch((err) => Promise.reject(err));
      }

      original._retried = true;
      _isRefreshing = true;

      try {
        const result = await _dispatch(refreshSession());

        if (refreshSession.fulfilled.match(result)) {
          const newToken = result.payload.accessToken;
          processQueue(null, newToken);
          original.headers.Authorization = `Bearer ${newToken}`;
          return axiosInstance(original);
        } else {
          processQueue(new Error('Session expired'));
          _dispatch(logout());
          return Promise.reject(error);
        }
      } catch (refreshErr) {
        processQueue(refreshErr);
        _dispatch(logout());
        return Promise.reject(refreshErr);
      } finally {
        _isRefreshing = false;
      }
    }
  );
};

export default axiosInstance;

