import axiosInstance from './axiosInstance';

export const apiListStrategies   = ()           => axiosInstance.get('/strategies');
export const apiCreateStrategy   = (data)       => axiosInstance.post('/strategies', data);
export const apiGetStrategy      = (id)         => axiosInstance.get(`/strategies/${id}`);
export const apiUpdateStrategy   = (id, data)   => axiosInstance.patch(`/strategies/${id}`, data);
export const apiDeleteStrategy   = (id)         => axiosInstance.delete(`/strategies/${id}`);
export const apiStrategyTrades   = (id)         => axiosInstance.get(`/strategies/${id}/trades`);
export const apiGetMistakes      = (params)     => axiosInstance.get('/analytics/mistakes', { params });
