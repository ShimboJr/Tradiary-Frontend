/**
 * features/auth/authSlice.js  (full replacement)
 * Auth global state with async thunks for all auth operations.
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  apiRegister,
  apiLogin,
  apiGoogleAuth,
  apiRefresh,
  apiLogout,
  apiGetMe,
} from '@/api/auth';
import { setTheme } from '@/features/ui/uiSlice';

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const register = createAsyncThunk(
  'auth/register',
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const res = await apiRegister(data);
      const { user, accessToken } = res.data.data;
      if (user?.theme) dispatch(setTheme(user.theme));
      return { user, accessToken };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Registration failed.');
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const res = await apiLogin(data);
      const { user, accessToken } = res.data.data;
      if (user?.theme) dispatch(setTheme(user.theme));
      return { user, accessToken };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Sign-in failed.');
    }
  }
);

export const googleAuth = createAsyncThunk(
  'auth/googleAuth',
  async (credential, { rejectWithValue, dispatch }) => {
    try {
      const res = await apiGoogleAuth({ credential });
      const { user, accessToken } = res.data.data;
      if (user?.theme) dispatch(setTheme(user.theme));
      return { user, accessToken };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Google sign-in failed.');
    }
  }
);

export const refreshSession = createAsyncThunk(
  'auth/refresh',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const res = await apiRefresh();
      const { user, accessToken } = res.data.data;
      if (user?.theme) dispatch(setTheme(user.theme));
      return { user, accessToken };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Session expired.');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await apiLogout();
    } catch {
      // Always clear client state even if server call fails
    }
    return null;
  }
);

export const fetchMe = createAsyncThunk(
  'auth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiGetMe();
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to load user.');
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const initialState = {
  user: null,
  accessToken: null,
  status: 'idle',       // 'idle' | 'loading' | 'succeeded' | 'failed' | 'refreshing'
  error: null,
  bootstrapped: false,  // true after first refresh attempt on app load
};

const fulfilled = (state, action) => {
  state.user = action.payload.user;
  state.accessToken = action.payload.accessToken;
  state.status = 'succeeded';
  state.error = null;
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.status = 'succeeded';
      state.error = null;
    },
    clearCredentials: (state) => {
      state.user = null;
      state.accessToken = null;
      state.status = 'idle';
      state.error = null;
    },
    setBootstrapped: (state) => {
      state.bootstrapped = true;
    },
    updateUser: (state, action) => {
      if (state.user) state.user = { ...state.user, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    // ── register ──────────────────────────────────────────────────────────────
    builder
      .addCase(register.pending,   (state) => { state.status = 'loading'; state.error = null; })
      .addCase(register.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.status = 'succeeded';
        state.error = null;
        state.bootstrapped = true;
      })
      .addCase(register.rejected,  (state, a) => { state.status = 'failed'; state.error = a.payload; });

    // ── login ─────────────────────────────────────────────────────────────────
    builder
      .addCase(login.pending,   (state) => { state.status = 'loading'; state.error = null; })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.status = 'succeeded';
        state.error = null;
        state.bootstrapped = true;
      })
      .addCase(login.rejected,  (state, a) => { state.status = 'failed'; state.error = a.payload; });

    builder
      .addCase(googleAuth.pending,   (state) => { state.status = 'loading'; state.error = null; })
      .addCase(googleAuth.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.status = 'succeeded';
        state.error = null;
        state.bootstrapped = true;
      })
      .addCase(googleAuth.rejected,  (state, a) => { state.status = 'failed'; state.error = a.payload; });

    // ── refresh ───────────────────────────────────────────────────────────────
    builder
      .addCase(refreshSession.pending,   (state) => { state.status = 'refreshing'; })
      .addCase(refreshSession.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.status = 'succeeded';
        state.error = null;
        state.bootstrapped = true;
      })
      .addCase(refreshSession.rejected,  (state) => {
        state.user = null;
        state.accessToken = null;
        state.status = 'idle';
        state.bootstrapped = true;
      });

    // ── logout ────────────────────────────────────────────────────────────────
    builder
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.status = 'idle';
        state.error = null;
      });

    // ── fetchMe ───────────────────────────────────────────────────────────────
    builder
      .addCase(fetchMe.fulfilled, (state, action) => { state.user = action.payload; });
  },
});

export const { setCredentials, clearCredentials, setBootstrapped, updateUser } = authSlice.actions;

// ─── Selectors ────────────────────────────────────────────────────────────────
export const selectCurrentUser     = (s) => s.auth.user;
export const selectAccessToken     = (s) => s.auth.accessToken;
export const selectAuthStatus      = (s) => s.auth.status;
export const selectAuthError       = (s) => s.auth.error;
export const selectBootstrapped    = (s) => s.auth.bootstrapped;
export const selectIsAuthenticated = (s) => Boolean(s.auth.user && s.auth.accessToken);
export const selectIsLoading       = (s) => s.auth.status === 'loading' || s.auth.status === 'refreshing';

export default authSlice.reducer;
