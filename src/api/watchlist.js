import axiosInstance from './axiosInstance';

export const apiListWatchlist   = ()         => axiosInstance.get('/watchlist');
export const apiAddWatchlist    = (data)     => axiosInstance.post('/watchlist', data);
export const apiUpdateWatchlist = (id, data) => axiosInstance.patch(`/watchlist/${id}`, data);
export const apiDeleteWatchlist = (id)       => axiosInstance.delete(`/watchlist/${id}`);
