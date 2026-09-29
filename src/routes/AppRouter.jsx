/**
 * routes/AppRouter.jsx  — all pages registered
 */

import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppShell      from '@/components/layout/AppShell';
import PublicLayout  from '@/components/layout/PublicLayout';
import AuthLayout    from '@/components/layout/AuthLayout';
import ProtectedRoute from './ProtectedRoute';
import Logo from '@/components/ui/Logo';

// ── Public ───────────────────────────────────────────────────────────────────
const LandingPage        = lazy(() => import('@/pages/LandingPage'));
const TermsPage          = lazy(() => import('@/pages/TermsPage'));
const PrivacyPage        = lazy(() => import('@/pages/PrivacyPage'));
const NotFoundPage       = lazy(() => import('@/pages/NotFoundPage'));

// ── Auth ─────────────────────────────────────────────────────────────────────
const SignInPage         = lazy(() => import('@/pages/auth/SignInPage'));
const SignUpPage         = lazy(() => import('@/pages/auth/SignUpPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPasswordPage  = lazy(() => import('@/pages/auth/ResetPasswordPage'));
const VerifyEmailPage    = lazy(() => import('@/pages/auth/VerifyEmailPage'));

// ── App ──────────────────────────────────────────────────────────────────────
const DashboardPage      = lazy(() => import('@/pages/app/DashboardPage'));
const TradesPage         = lazy(() => import('@/pages/app/TradesPage'));
const TradeDetailPage    = lazy(() => import('@/pages/app/TradeDetailPage'));
const CalendarPage       = lazy(() => import('@/pages/app/CalendarPage'));
const PlaybooksPage      = lazy(() => import('@/pages/app/PlaybooksPage'));
const StrategyDetailPage = lazy(() => import('@/pages/app/StrategyDetailPage'));
const JournalPage        = lazy(() => import('@/pages/app/JournalPage'));
const GoalsPage          = lazy(() => import('@/pages/app/GoalsPage'));
const MistakesPage       = lazy(() => import('@/pages/app/MistakesPage'));
const WatchlistPage      = lazy(() => import('@/pages/app/WatchlistPage'));
const RiskCalculatorPage = lazy(() => import('@/pages/app/RiskCalculatorPage'));
const SettingsPage       = lazy(() => import('@/pages/app/SettingsPage'));

// ── Splash loader ─────────────────────────────────────────────────────────────
const PageLoader = () => (
  <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[var(--bg)]">
    <Logo variant="full" size={36} />
    <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--brand-indigo)] border-t-transparent" />
  </div>
);

const AppRouter = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* ── Public pages ── */}
      <Route element={<PublicLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="/terms"   element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
      </Route>

      {/* ── Auth pages (split-screen layout) ── */}
      <Route element={<AuthLayout />}>
        <Route path="/signin"                element={<SignInPage />} />
        <Route path="/signup"                element={<SignUpPage />} />
        <Route path="/forgot-password"       element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/verify-email/:token"   element={<VerifyEmailPage />} />
      </Route>

      {/* ── Protected app ── */}
      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<AppShell />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          {/* Trading */}
          <Route path="dashboard"   element={<DashboardPage />} />
          <Route path="trades"      element={<TradesPage />} />
          <Route path="trades/:id"  element={<TradeDetailPage />} />
          <Route path="calendar"    element={<CalendarPage />} />
          {/* Playbooks */}
          <Route path="playbooks"      element={<PlaybooksPage />} />
          <Route path="playbooks/:id"  element={<StrategyDetailPage />} />
          {/* Insights */}
          <Route path="journal"    element={<JournalPage />} />
          <Route path="goals"      element={<GoalsPage />} />
          <Route path="mistakes"   element={<MistakesPage />} />
          <Route path="watchlist"  element={<WatchlistPage />} />
          {/* Tools */}
          <Route path="tools/risk-calculator" element={<RiskCalculatorPage />} />
          {/* Settings */}
          <Route path="settings"   element={<SettingsPage />} />
        </Route>
      </Route>

      {/* ── 404 ── */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </Suspense>
);

export default AppRouter;
