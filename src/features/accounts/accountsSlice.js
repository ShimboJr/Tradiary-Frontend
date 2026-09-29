/**
 * features/accounts/accountsSlice.js
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiListAccounts, apiCreateAccount, apiUpdateAccount, apiDeleteAccount } from '@/api/accounts';

export const fetchAccounts = createAsyncThunk('accounts/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const res = await apiListAccounts();
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || 'Failed to load accounts.');
  }
});

export const createAccount = createAsyncThunk('accounts/create', async (data, { rejectWithValue }) => {
  try {
    const res = await apiCreateAccount(data);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || 'Failed to create account.');
  }
});

export const updateAccount = createAsyncThunk('accounts/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await apiUpdateAccount(id, data);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || 'Failed to update account.');
  }
});

export const deleteAccount = createAsyncThunk('accounts/delete', async (id, { rejectWithValue }) => {
  try {
    await apiDeleteAccount(id);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || 'Failed to delete account.');
  }
});

const accountsSlice = createSlice({
  name: 'accounts',
  initialState: { list: [], status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAccounts.fulfilled,  (s, a) => { s.list = a.payload; s.status = 'succeeded'; })
      .addCase(fetchAccounts.pending,    (s)     => { s.status = 'loading'; })
      .addCase(fetchAccounts.rejected,   (s, a)  => { s.status = 'failed'; s.error = a.payload; })
      .addCase(createAccount.fulfilled,  (s, a)  => { s.list.push(a.payload); })
      .addCase(updateAccount.fulfilled,  (s, a)  => {
        const i = s.list.findIndex(acc => acc._id === a.payload._id);
        if (i !== -1) s.list[i] = a.payload;
      })
      .addCase(deleteAccount.fulfilled,  (s, a)  => {
        s.list = s.list.filter(acc => acc._id !== a.payload);
      });
  },
});

export const selectAccounts = (s) => s.accounts.list;
export const selectAccountsStatus = (s) => s.accounts.status;
export default accountsSlice.reducer;
