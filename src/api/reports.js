/**
 * api/reports.js
 * Client-side API calls for PDF reports and trade card generation.
 */

import api from './axiosInstance';

/**
 * GET /api/reports/pdf — download a performance report PDF.
 * @param {{ from?: string, to?: string, accountId?: string }} params
 */
export const apiDownloadPdf = (params = {}) =>
  api.get('/reports/pdf', { params, responseType: 'blob' });

/**
 * GET /api/reports/trade-card/:tradeId — get a shareable SVG trade card.
 * @param {string} tradeId
 */
export const apiGetTradeCard = (tradeId) =>
  api.get(`/reports/trade-card/${tradeId}`, { responseType: 'text' });
