/**
 * components/layout/AppShell.jsx
 * Main app layout: Sidebar (desktop) + Topbar + EmailVerifyBanner + page content.
 * MobileNav shown on small screens. Bottom padding on mobile for nav bar.
 * OnboardingTour and Toaster are also rendered here.
 */

import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import MobileNav from './MobileNav';
import EmailVerifyBanner from './EmailVerifyBanner';
import Toaster from '@/components/ui/Toast';
import OnboardingTour from '@/components/onboarding/OnboardingTour';
import { selectTheme, selectSidebarCollapsed } from '@/features/ui/uiSlice';

const AppShell = () => {
  const theme     = useSelector(selectTheme);
  const collapsed = useSelector(selectSidebarCollapsed);

  // Sync data-theme attribute on <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

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
        <Topbar />
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
    </div>
  );
};

export default AppShell;
