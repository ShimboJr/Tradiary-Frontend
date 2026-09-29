/**
 * api/accounts.js
 */
import axiosInstance from './axiosInstance';

export const apiListAccounts   = ()       => axiosInstance.get('/accounts');
export const apiCreateAccount  = (data)   => axiosInstance.post('/accounts', data);
export const apiUpdateAccount  = (id, d)  => axiosInstance.patch(`/accounts/${id}`, d);
export const apiDeleteAccount  = (id)     => axiosInstance.delete(`/accounts/${id}`);
