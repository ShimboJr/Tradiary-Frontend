/**
 * components/layout/AppShell.jsx
 * Main app layout: Sidebar (desktop) + Topbar + EmailVerifyBanner + page content.
 * MobileNav shown on small screens. Bottom padding on mobile for nav bar.
 * OnboardingTour and Toaster are also rendered here.
 *
 * Global keyboard shortcut: press N (not inside a text field) → opens New Trade modal.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import MobileNav from './MobileNav';
import EmailVerifyBanner from './EmailVerifyBanner';
import Toaster from '@/components/ui/Toast';
import OnboardingTour from '@/components/onboarding/OnboardingTour';
import TradeFormModal from '@/components/trades/TradeFormModal';
import { selectTheme, selectSidebarCollapsed } from '@/features/ui/uiSlice';
import { fetchAccounts, selectAccounts } from '@/features/accounts/accountsSlice';
import { fetchTrades } from '@/features/trades/tradesSlice';
import { useNewTradeHotkey } from '@/hooks/useNewTradeHotkey';

const AppShell = () => {
  const dispatch  = useDispatch();
  const theme     = useSelector(selectTheme);
  const collapsed = useSelector(selectSidebarCollapsed);
  const accounts  = useSelector(selectAccounts);

  const [showNewTrade, setShowNewTrade] = useState(false);

  // Sync data-theme attribute on <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Ensure accounts are loaded (needed by TradeFormModal)
  useEffect(() => {
    if (accounts.length === 0) dispatch(fetchAccounts());
  }, []);

  const openNewTrade = useCallback(() => setShowNewTrade(true), []);

  // Global N key shortcut
  useNewTradeHotkey(openNewTrade);

  const sidebarWidth = collapsed ? '64px' : '240px';

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content area — offset by sidebar width on desktop */}
      <div
        className="flex flex-col transition-[margin-left] duration-300 ease-in-out lg:ml-[var(--sidebar-offset)]"
        style={{ '--sidebar-offset': sidebarWidth }}
      >
        <Topbar onNewTrade={openNewTrade} />
        <EmailVerifyBanner />

        {/* Page content — extra bottom padding on mobile for nav bar */}
        <main className="flex-1 p-4 sm:p-6 pb-24 lg:pb-6 animate-fade-in">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />

      {/* Global overlays */}
      <OnboardingTour />
      <Toaster />

      {/* Global New Trade modal (triggered by N hotkey or Topbar button) */}
      <TradeFormModal
        open={showNewTrade}
        onClose={() => setShowNewTrade(false)}
        defaultAccountId={accounts[0]?._id}
        onSaved={() => {
          setShowNewTrade(false);
          // Refresh trade list if the user is currently on the trades page
          dispatch(fetchTrades({ page: 1, limit: 25, sortBy: 'entryDate', sortDir: 'desc' }));
        }}
      />
    </div>
  );
};

export default AppShell;

