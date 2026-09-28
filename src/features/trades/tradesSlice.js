/**
 * features/trades/tradesSlice.js
 * Placeholder slice for the Trades feature.
 * Full model + CRUD thunks built in Prompt 02.
 *
 * Future state shape:
 * {
 *   list: [],          // paginated trade list
 *   selected: null,    // currently viewed trade
 *   filters: {},       // active filter/sort params
 *   pagination: {},    // page, limit, total
 *   status: 'idle',
 *   error: null,
 * }
 */

import { createSlice } from '@reduxjs/toolkit';

const tradesSlice = createSlice({
  name: 'trades',
  initialState: {
    list: [],
    selected: null,
    filters: {},
    pagination: { page: 1, limit: 25, total: 0 },
    status: 'idle',
    error: null,
  },
  reducers: {
    // Placeholder — reducers added in Prompt 02
  },
});

export default tradesSlice.reducer;
