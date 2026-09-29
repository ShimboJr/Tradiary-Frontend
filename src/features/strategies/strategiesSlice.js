/**
 * features/strategies/strategiesSlice.js
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  apiListStrategies, apiCreateStrategy, apiGetStrategy,
  apiUpdateStrategy, apiDeleteStrategy, apiStrategyTrades,
} from '@/api/strategies';

export const fetchStrategies   = createAsyncThunk('strategies/list',   async (_, { rejectWithValue }) => {
  try { return (await apiListStrategies()).data.data; }
  catch (e) { return rejectWithValue(e.response?.data?.error?.message || 'Failed.'); }
});
export const createStrategy    = createAsyncThunk('strategies/create', async (data, { rejectWithValue }) => {
  try { return (await apiCreateStrategy(data)).data.data; }
  catch (e) { return rejectWithValue(e.response?.data?.error?.message || 'Failed.'); }
});
export const fetchStrategy     = createAsyncThunk('strategies/detail', async (id, { rejectWithValue }) => {
  try { return (await apiGetStrategy(id)).data.data; }
  catch (e) { return rejectWithValue(e.response?.data?.error?.message || 'Failed.'); }
});
export const updateStrategy    = createAsyncThunk('strategies/update', async ({ id, data }, { rejectWithValue }) => {
  try { return (await apiUpdateStrategy(id, data)).data.data; }
  catch (e) { return rejectWithValue(e.response?.data?.error?.message || 'Failed.'); }
});
export const deleteStrategy    = createAsyncThunk('strategies/delete', async (id, { rejectWithValue }) => {
  try { await apiDeleteStrategy(id); return id; }
  catch (e) { return rejectWithValue(e.response?.data?.error?.message || 'Failed.'); }
});
export const fetchStrategyTrades = createAsyncThunk('strategies/trades', async (id, { rejectWithValue }) => {
  try { return (await apiStrategyTrades(id)).data.data; }
  catch (e) { return rejectWithValue(e.response?.data?.error?.message || 'Failed.'); }
});

const strategiesSlice = createSlice({
  name: 'strategies',
  initialState: {
    items:          [],
    selected:       null,
    strategyTrades: [],
    status:         'idle',
    detailStatus:   'idle',
    error:          null,
  },
  reducers: {
    clearSelected: (s) => { s.selected = null; s.strategyTrades = []; },
  },
  extraReducers: (b) => {
    b
      .addCase(fetchStrategies.pending,   (s)    => { s.status = 'loading'; })
      .addCase(fetchStrategies.fulfilled, (s, a) => { s.items = a.payload; s.status = 'succeeded'; })
      .addCase(fetchStrategies.rejected,  (s, a) => { s.status = 'failed'; s.error = a.payload; })
      .addCase(createStrategy.fulfilled,  (s, a) => { s.items.unshift(a.payload); })
      .addCase(updateStrategy.fulfilled,  (s, a) => { const i = s.items.findIndex(x => x._id === a.payload._id); if (i >= 0) s.items[i] = a.payload; if (s.selected?._id === a.payload._id) s.selected = a.payload; })
      .addCase(deleteStrategy.fulfilled,  (s, a) => { s.items = s.items.filter(x => x._id !== a.payload); })
      .addCase(fetchStrategy.pending,     (s)    => { s.detailStatus = 'loading'; })
      .addCase(fetchStrategy.fulfilled,   (s, a) => { s.selected = a.payload; s.detailStatus = 'succeeded'; })
      .addCase(fetchStrategyTrades.fulfilled, (s, a) => { s.strategyTrades = a.payload; });
  },
});

export const { clearSelected } = strategiesSlice.actions;
export const selectStrategies     = (s) => s.strategies.items;
export const selectStrategy       = (s) => s.strategies.selected;
export const selectStrategyTrades = (s) => s.strategies.strategyTrades;
export const selectStrategiesStatus = (s) => s.strategies.status;
export const selectStrategyDetailStatus = (s) => s.strategies.detailStatus;
export default strategiesSlice.reducer;
