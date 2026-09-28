/**
 * api/health.js
 * Health-check API module.
 */

import axiosInstance from './axiosInstance';

export const fetchHealth = () => axiosInstance.get('/health');
