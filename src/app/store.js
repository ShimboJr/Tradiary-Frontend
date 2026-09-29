/**
 * app/store.js  (updated to include toast slice)
 */

import { configureStore } from '@reduxjs/toolkit';
import authReducer      from '@/features/auth/authSlice';
import uiReducer        from '@/features/ui/uiSlice';
import toastReducer     from '@/features/ui/toastSlice';
import tradesReducer    from '@/features/trades/tradesSlice';
import accountsReducer  from '@/features/accounts/accountsSlice';
import analyticsReducer from '@/features/analytics/analyticsSlice';

export const store = configureStore({
  reducer: {
    auth:      authReducer,
    ui:        uiReducer,
    toast:     toastReducer,
    trades:    tradesReducer,
    accounts:  accountsReducer,
    analytics: analyticsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: { ignoredActions: [] } }),
  devTools: import.meta.env.MODE !== 'production',
});

/** @typedef {ReturnType<typeof store.getState>} RootState */
/** @typedef {typeof store.dispatch} AppDispatch */
