/**
 * components/layout/AppShell.jsx  (updated)
 * Adds EmailVerifyBanner and Toaster. Theme sync preserved.
 */

import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import EmailVerifyBanner from './EmailVerifyBanner';
import Toaster from '@/components/ui/Toast';
import { selectTheme } from '@/features/ui/uiSlice';
import { selectSidebarCollapsed } from '@/features/ui/uiSlice';

const AppShell = () => {
  const theme = useSelector(selectTheme);
  const collapsed = useSelector(selectSidebarCollapsed);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const sidebarWidth = collapsed ? '64px' : '240px';

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <Sidebar />

      <div
        className="flex flex-col transition-[margin-left] duration-300 ease-in-out"
        style={{ marginLeft: sidebarWidth }}
      >
        <Topbar />
        <EmailVerifyBanner />

        <main className="flex-1 p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>

      <Toaster />
    </div>
  );
};

export default AppShell;
