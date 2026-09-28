/**
 * routes/AppRouter.jsx  (full replacement)
 * All routes: public landing, auth pages (in AuthLayout), protected app pages.
 */

import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppShell from '@/components/layout/AppShell';
import PublicLayout from '@/components/layout/PublicLayout';
import AuthLayout from '@/components/layout/AuthLayout';
import ProtectedRoute from './ProtectedRoute';
import PlaceholderPage from '@/pages/PlaceholderPage';

// ── Lazy-loaded pages ─────────────────────────────────────────────────────────
const LandingPage        = lazy(() => import('@/pages/LandingPage'));
const SignInPage         = lazy(() => import('@/pages/auth/SignInPage'));
const SignUpPage         = lazy(() => import('@/pages/auth/SignUpPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPasswordPage  = lazy(() => import('@/pages/auth/ResetPasswordPage'));
const VerifyEmailPage    = lazy(() => import('@/pages/auth/VerifyEmailPage'));

const PageLoader = () => (
  <div className="flex h-64 items-center justify-center">
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-brand)] border-t-transparent" />
  </div>
);

const AppRouter = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* ── Landing ── */}
      <Route element={<PublicLayout />}>
        <Route index element={<LandingPage />} />
      </Route>

      {/* ── Auth pages (split-screen layout) ── */}
      <Route element={<AuthLayout />}>
        <Route path="/signin"          element={<SignInPage />} />
        <Route path="/signup"          element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/verify-email/:token"   element={<VerifyEmailPage />} />
      </Route>

      {/* ── Protected app ── */}
      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<AppShell />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<PlaceholderPage title="Dashboard" description="Your trading performance at a glance — coming next." />} />
          <Route path="trades"    element={<PlaceholderPage title="Trades"    description="Log and review all your trades — coming soon." />} />
          <Route path="calendar"  element={<PlaceholderPage title="Calendar"  description="Daily P&L calendar view — coming soon." />} />
          <Route path="analytics" element={<PlaceholderPage title="Analytics" description="Deep performance analytics — coming soon." />} />
          <Route path="playbooks" element={<PlaceholderPage title="Playbooks" description="Define and track your trading setups — coming soon." />} />
          <Route path="settings"  element={<PlaceholderPage title="Settings"  description="Account and preferences — coming soon." />} />
        </Route>
      </Route>

      {/* ── 404 ── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>
);

export default AppRouter;
