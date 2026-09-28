/**
 * App.jsx
 * Root component — wraps BrowserRouter and renders AppRouter.
 */

import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRouter from '@/routes/AppRouter';

const App = () => (
  <BrowserRouter>
    <AppRouter />
  </BrowserRouter>
);

export default App;
