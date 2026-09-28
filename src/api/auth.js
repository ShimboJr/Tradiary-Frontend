/**
 * api/auth.js
 * Auth API endpoint modules.
 */

import axiosInstance from './axiosInstance';

export const apiRegister       = (data)    => axiosInstance.post('/auth/register', data);
export const apiLogin          = (data)    => axiosInstance.post('/auth/login', data);
export const apiGoogleAuth     = (data)    => axiosInstance.post('/auth/google', data);
export const apiRefresh        = ()        => axiosInstance.post('/auth/refresh');
export const apiLogout         = ()        => axiosInstance.post('/auth/logout');
export const apiGetMe          = ()        => axiosInstance.get('/auth/me');
export const apiVerifyEmail    = (token)   => axiosInstance.get(`/auth/verify-email/${token}`);
export const apiResendVerify   = ()        => axiosInstance.post('/auth/resend-verification');
export const apiForgotPassword = (data)    => axiosInstance.post('/auth/forgot-password', data);
export const apiResetPassword  = (token, data) => axiosInstance.post(`/auth/reset-password/${token}`, data);
