/**
 * components/layout/PublicLayout.jsx
 * Minimal wrapper for public-facing pages (landing, login, register, etc.)
 * Syncs theme to <html> just like AppShell.
 */

import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectTheme } from '@/features/ui/uiSlice';

const PublicLayout = () => {
  const theme = useSelector(selectTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <Outlet />
    </div>
  );
};

export default PublicLayout;
