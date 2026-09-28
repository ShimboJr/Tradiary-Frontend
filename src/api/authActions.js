/**
 * api/authActions.js
 * Re-exports the two auth thunks used by the Axios 401 interceptor.
 * Keeping them in a separate file lets the interceptor import them
 * statically without creating a circular dependency with the store,
 * and eliminates the Vite mixed static/dynamic import warning.
 */
export { refreshSession, logout } from '@/features/auth/authSlice';
