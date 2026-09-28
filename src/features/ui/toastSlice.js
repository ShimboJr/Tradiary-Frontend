/**
 * features/ui/toastSlice.js
 * Lightweight toast notification queue.
 */

import { createSlice, nanoid } from '@reduxjs/toolkit';

const toastSlice = createSlice({
  name: 'toast',
  initialState: { toasts: [] },
  reducers: {
    addToast: {
      reducer: (state, action) => {
        state.toasts.push(action.payload);
      },
      prepare: ({ message, type = 'info', duration = 4000 }) => ({
        payload: { id: nanoid(), message, type, duration },
      }),
    },
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
  },
});

export const { addToast, removeToast } = toastSlice.actions;
export const selectToasts = (s) => s.toast.toasts;

// Shorthand helpers
export const toastSuccess = (message, duration) => addToast({ message, type: 'success', duration });
export const toastError   = (message, duration) => addToast({ message, type: 'error',   duration });
export const toastInfo    = (message, duration) => addToast({ message, type: 'info',    duration });
export const toastWarn    = (message, duration) => addToast({ message, type: 'warning', duration });

export default toastSlice.reducer;
