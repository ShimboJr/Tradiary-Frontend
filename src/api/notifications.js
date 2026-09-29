/**
 * api/notifications.js
 * Client-side API calls for in-app notifications.
 */

import api from './axiosInstance';

/** GET /api/notifications — latest 30, unread first */
export const apiGetNotifications = () =>
  api.get('/notifications');

/** PATCH /api/notifications/:id/read */
export const apiMarkNotificationRead = (id) =>
  api.patch(`/notifications/${id}/read`);

/** POST /api/notifications/mark-all-read */
export const apiMarkAllNotificationsRead = () =>
  api.post('/notifications/mark-all-read');
