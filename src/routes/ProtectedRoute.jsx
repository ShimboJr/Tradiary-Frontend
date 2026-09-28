/**
 * routes/ProtectedRoute.jsx
 * On first render, silently attempts /api/auth/refresh to restore a session.
 * Shows a full-screen spinner during that bootstrap phase.
 * After bootstrap, redirects to /signin if unauthenticated.
 */

import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Loader2 } from 'lucide-react';
import {
  refreshSession,
  selectIsAuthenticated,
  selectBootstrapped,
} from '@/features/auth/authSlice';

const ProtectedRoute = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const bootstrapped = useSelector(selectBootstrapped);

  // Attempt silent refresh exactly once on mount
  useEffect(() => {
    if (!bootstrapped) {
      dispatch(refreshSession());
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Show spinner while we're still checking the session
  if (!bootstrapped) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-[var(--color-brand)]" />
          <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
