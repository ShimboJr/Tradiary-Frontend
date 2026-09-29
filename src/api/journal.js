import axiosInstance from './axiosInstance';

export const apiListJournal     = (params) => axiosInstance.get('/journal', { params });
export const apiGetJournalDate  = (date)   => axiosInstance.get(`/journal/${date}`);
export const apiUpsertJournal   = (date, data) => axiosInstance.put(`/journal/${date}`, data);
export const apiDeleteJournal   = (date)   => axiosInstance.delete(`/journal/${date}`);
export const apiMoodChart       = (params) => axiosInstance.get('/journal/mood-chart', { params });
