/**
 * features/trades/tradesSlice.js  — full implementation
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  apiListTrades, apiCreateTrade, apiGetTrade,
  apiUpdateTrade, apiDeleteTrade,
  apiBulkDeleteTrades, apiBulkTagTrades,
} from '@/api/trades';

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchTrades = createAsyncThunk('trades/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const res = await apiListTrades(params);
    return res.data.data; // { trades, pagination }
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || 'Failed to load trades.');
  }
});

export const fetchTrade = createAsyncThunk('trades/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const res = await apiGetTrade(id);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || 'Trade not found.');
  }
});

export const createTrade = createAsyncThunk('trades/create', async (data, { rejectWithValue }) => {
  try {
    const res = await apiCreateTrade(data);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || 'Failed to create trade.');
  }
});

export const updateTrade = createAsyncThunk('trades/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await apiUpdateTrade(id, data);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || 'Failed to update trade.');
  }
});

export const deleteTrade = createAsyncThunk('trades/delete', async (id, { rejectWithValue }) => {
  try {
    await apiDeleteTrade(id);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || 'Failed to delete trade.');
  }
});

export const bulkDeleteTrades = createAsyncThunk('trades/bulkDelete', async (ids, { rejectWithValue }) => {
  try {
    await apiBulkDeleteTrades(ids);
    return ids;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || 'Bulk delete failed.');
  }
});

export const bulkTagTrades = createAsyncThunk('trades/bulkTag', async ({ ids, tags, mode }, { rejectWithValue }) => {
  try {
    await apiBulkTagTrades(ids, tags, mode);
    return { ids, tags, mode };
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || 'Bulk tag failed.');
  }
});

// ─── Slice ────────────────────────────────────────────────────────────────────

const tradesSlice = createSlice({
  name: 'trades',
  initialState: {
    list: [],
    selected: null,
    filters: {},
    pagination: { page: 1, limit: 25, total: 0, pages: 1 },
    status: 'idle',
    error: null,
  },
  reducers: {
    setFilters: (state, action) => { state.filters = action.payload; },
    clearSelected: (state) => { state.selected = null; },
  },
  extraReducers: (builder) => {
    builder
      // fetchTrades
      .addCase(fetchTrades.pending,    (s) => { s.status = 'loading'; s.error = null; })
      .addCase(fetchTrades.fulfilled,  (s, a) => {
        s.list       = a.payload.trades;
        s.pagination = a.payload.pagination;
        s.status     = 'succeeded';
      })
      .addCase(fetchTrades.rejected,   (s, a) => { s.status = 'failed'; s.error = a.payload; })
      // fetchTrade
      .addCase(fetchTrade.pending,     (s) => { s.status = 'loading'; })
      .addCase(fetchTrade.fulfilled,   (s, a) => { s.selected = a.payload; s.status = 'succeeded'; })
      .addCase(fetchTrade.rejected,    (s, a) => { s.status = 'failed'; s.error = a.payload; })
      // createTrade
      .addCase(createTrade.fulfilled,  (s, a) => { s.list.unshift(a.payload); s.pagination.total += 1; })
      // updateTrade
      .addCase(updateTrade.fulfilled,  (s, a) => {
        const i = s.list.findIndex(t => t._id === a.payload._id);
        if (i !== -1) s.list[i] = a.payload;
        if (s.selected?._id === a.payload._id) s.selected = a.payload;
      })
      // deleteTrade
      .addCase(deleteTrade.fulfilled,  (s, a) => {
        s.list = s.list.filter(t => t._id !== a.payload);
        s.pagination.total = Math.max(0, s.pagination.total - 1);
      })
      // bulkDeleteTrades
      .addCase(bulkDeleteTrades.fulfilled, (s, a) => {
        const removed = new Set(a.payload);
        s.list = s.list.filter(t => !removed.has(t._id));
        s.pagination.total = Math.max(0, s.pagination.total - a.payload.length);
      });
  },
});

export const { setFilters, clearSelected } = tradesSlice.actions;

export const selectTrades     = (s) => s.trades.list;
export const selectTrade      = (s) => s.trades.selected;
export const selectTradesPagination = (s) => s.trades.pagination;
export const selectTradesStatus     = (s) => s.trades.status;
export const selectTradesError      = (s) => s.trades.error;

export default tradesSlice.reducer;
