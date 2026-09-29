/**
 * features/analytics/analyticsSlice.js
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiGetAnalyticsSummary } from '@/api/analytics';

export const fetchAnalytics = createAsyncThunk(
  'analytics/fetchSummary',
  async (params, { rejectWithValue }) => {
    try {
      const res = await apiGetAnalyticsSummary(params);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to load analytics.');
    }
  }
);

export const fetchComparisonAnalytics = createAsyncThunk(
  'analytics/fetchComparison',
  async (params, { rejectWithValue }) => {
    try {
      const res = await apiGetAnalyticsSummary(params);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to load comparison.');
    }
  }
);

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState: {
    summary:    null,
    comparison: null,
    status:     'idle',
    compStatus: 'idle',
    error:      null,
  },
  reducers: {
    clearComparison: (state) => { state.comparison = null; state.compStatus = 'idle'; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnalytics.pending,   (s)    => { s.status = 'loading'; s.error = null; })
      .addCase(fetchAnalytics.fulfilled, (s, a) => { s.summary = a.payload; s.status = 'succeeded'; })
      .addCase(fetchAnalytics.rejected,  (s, a) => { s.status = 'failed'; s.error = a.payload; })
      .addCase(fetchComparisonAnalytics.pending,   (s)    => { s.compStatus = 'loading'; })
      .addCase(fetchComparisonAnalytics.fulfilled, (s, a) => { s.comparison = a.payload; s.compStatus = 'succeeded'; })
      .addCase(fetchComparisonAnalytics.rejected,  (s)    => { s.compStatus = 'failed'; });
  },
});

export const { clearComparison } = analyticsSlice.actions;
export const selectAnalytics     = (s) => s.analytics.summary;
export const selectComparison    = (s) => s.analytics.comparison;
export const selectAnalyticsStatus = (s) => s.analytics.status;
export const selectCompStatus    = (s) => s.analytics.compStatus;
export default analyticsSlice.reducer;
