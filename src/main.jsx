/**
 * main.jsx  (updated)
 * Wraps the app with GoogleOAuthProvider in addition to Redux Provider.
 * VITE_GOOGLE_CLIENT_ID must be set in client/.env
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { store } from '@/app/store';
import { initAxiosInterceptors } from '@/api/axiosInstance';
import App from './App';
import '@/styles/index.css';

// Wire Axios store-aware interceptors
initAxiosInterceptors(store);

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <App />
      </GoogleOAuthProvider>
    </Provider>
  </React.StrictMode>
);
