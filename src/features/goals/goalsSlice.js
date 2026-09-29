/**
 * features/goals/goalsSlice.js
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiListGoals, apiCreateGoal, apiUpdateGoal, apiDeleteGoal } from '@/api/goals';

export const fetchGoals  = createAsyncThunk('goals/list',   async (_, { rejectWithValue }) => {
  try { return (await apiListGoals()).data.data; }
  catch (e) { return rejectWithValue(e.response?.data?.error?.message || 'Failed.'); }
});
export const createGoal  = createAsyncThunk('goals/create', async (data, { rejectWithValue }) => {
  try { return (await apiCreateGoal(data)).data.data; }
  catch (e) { return rejectWithValue(e.response?.data?.error?.message || 'Failed.'); }
});
export const updateGoal  = createAsyncThunk('goals/update', async ({ id, data }, { rejectWithValue }) => {
  try { return (await apiUpdateGoal(id, data)).data.data; }
  catch (e) { return rejectWithValue(e.response?.data?.error?.message || 'Failed.'); }
});
export const deleteGoal  = createAsyncThunk('goals/delete', async (id, { rejectWithValue }) => {
  try { await apiDeleteGoal(id); return id; }
  catch (e) { return rejectWithValue(e.response?.data?.error?.message || 'Failed.'); }
});

const goalsSlice = createSlice({
  name: 'goals',
  initialState: { items: [], status: 'idle', error: null },
  reducers: {},
  extraReducers: (b) => {
    b
      .addCase(fetchGoals.pending,   (s)    => { s.status = 'loading'; })
      .addCase(fetchGoals.fulfilled, (s, a) => { s.items = a.payload; s.status = 'succeeded'; })
      .addCase(fetchGoals.rejected,  (s, a) => { s.status = 'failed'; s.error = a.payload; })
      .addCase(createGoal.fulfilled, (s, a) => { s.items.unshift(a.payload); })
      .addCase(updateGoal.fulfilled, (s, a) => { const i = s.items.findIndex(x => x._id === a.payload._id); if (i >= 0) s.items[i] = a.payload; })
      .addCase(deleteGoal.fulfilled, (s, a) => { s.items = s.items.filter(x => x._id !== a.payload); });
  },
});

export const selectGoals       = (s) => s.goals.items;
export const selectGoalsStatus = (s) => s.goals.status;
export default goalsSlice.reducer;
