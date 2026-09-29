/**
 * api/users.js
 * Client-side API calls for user profile, password, data export, and account deletion.
 */

import api from './axiosInstance';

/** PATCH /api/users/me — update profile fields */
export const apiUpdateProfile = (data) =>
  api.patch('/users/me', data);

/** POST /api/users/me/change-password */
export const apiChangePassword = (data) =>
  api.post('/users/me/change-password', data);

/** POST /api/users/me/set-password — for Google-only accounts adding a local password */
export const apiSetPassword = (data) =>
  api.post('/users/me/set-password', data);

/** GET /api/users/me/export — triggers a JSON download */
export const apiExportData = () =>
  api.get('/users/me/export', { responseType: 'blob' });

/** DELETE /api/users/me — permanent GDPR account deletion */
export const apiDeleteAccount = () =>
  api.delete('/users/me');
