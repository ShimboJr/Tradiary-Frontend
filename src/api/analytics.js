/**
 * api/analytics.js
 */
import axiosInstance from './axiosInstance';

export const apiGetAnalyticsSummary = (params) =>
  axiosInstance.get('/analytics/summary', { params });
