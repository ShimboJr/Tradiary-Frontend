/**
 * api/trades.js
 */
import axiosInstance from './axiosInstance';

export const apiListTrades      = (params) => axiosInstance.get('/trades', { params });
export const apiCreateTrade     = (data)   => axiosInstance.post('/trades', data);
export const apiGetTrade        = (id)     => axiosInstance.get(`/trades/${id}`);
export const apiUpdateTrade     = (id, d)  => axiosInstance.patch(`/trades/${id}`, d);
export const apiDeleteTrade     = (id)     => axiosInstance.delete(`/trades/${id}`);
export const apiBulkDeleteTrades= (ids)   => axiosInstance.post('/trades/bulk-delete', { ids });
export const apiBulkTagTrades   = (ids, tags, mode) => axiosInstance.post('/trades/bulk-tag', { ids, tags, mode });
export const apiImportTrades    = (data)   => axiosInstance.post('/trades/import', data);
export const apiExportTrades    = (params) => axiosInstance.get('/trades/export', { params, responseType: 'blob' });
export const apiCalendarData    = (params) => axiosInstance.get('/trades/calendar', { params });
export const apiUploadScreenshot= (formData) =>
  axiosInstance.post('/uploads/screenshot', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const apiGetReplayData   = (id, params = {}) => axiosInstance.get(`/trades/${id}/replay-data`, { params });
