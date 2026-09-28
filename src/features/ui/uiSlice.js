/**
 * features/ui/uiSlice.js
 * Global UI state — theme, sidebar collapsed, modal registry, etc.
 */

import { createSlice } from '@reduxjs/toolkit';

// Persist theme preference from localStorage
const getStoredTheme = () => {
  try {
    return localStorage.getItem('tradiary_theme') || 'dark';
  } catch {
    return 'dark';
  }
};

const initialState = {
  theme: getStoredTheme(),        // 'dark' | 'light'
  sidebarCollapsed: false,
  // Future: modal state, toast queue, etc.
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('tradiary_theme', state.theme);
      } catch {}
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
      try {
        localStorage.setItem('tradiary_theme', action.payload);
      } catch {}
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, action) => {
      state.sidebarCollapsed = action.payload;
    },
  },
});

export const { toggleTheme, setTheme, toggleSidebar, setSidebarCollapsed } = uiSlice.actions;

export const selectTheme            = (state) => state.ui.theme;
export const selectSidebarCollapsed = (state) => state.ui.sidebarCollapsed;

export default uiSlice.reducer;
