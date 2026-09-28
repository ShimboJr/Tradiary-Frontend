/**
 * components/layout/AuthLayout.jsx
 * Split-screen layout for all auth pages.
 * Left: brand panel with gradient, logo, and value prop.
 * Right: form panel.
 * Responsive: on mobile the brand panel collapses to a compact top bar.
 */

import React, { useEffect } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { TrendingUp, BarChart3, CheckCircle2 } from 'lucide-react';
import { selectTheme } from '@/features/ui/uiSlice';

const FEATURES = [
  'Unlimited trades — always free',
  'Deep analytics: win rate, profit factor, drawdown',
  'Google & email sign-in',
  'Fully configurable timezone & currency',
];

const AuthLayout = () => {
  const theme = useSelector(selectTheme);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className="flex min-h-screen bg-[var(--color-bg)]">

      {/* ── Left: Brand Panel (hidden on mobile, compact header on sm) ──────── */}
      <div className="relative hidden lg:flex lg:w-[480px] xl:w-[560px] flex-col justify-between overflow-hidden bg-[var(--color-surface)] border-r border-[var(--color-border)] p-10 shrink-0">
        {/* Gradient orb */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-[var(--color-brand)] opacity-10 blur-[80px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 right-0 h-[300px] w-[300px] rounded-full bg-[var(--color-gain)] opacity-5 blur-[60px]"
        />

        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 z-10 w-fit">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-brand)] shadow-glow">
            <TrendingUp size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Tradiary
          </span>
        </Link>

        {/* Centre content */}
        <div className="z-10 space-y-8">
          {/* Mini chart illustration */}
          <div className="flex items-end gap-1 h-20">
            {[30, 55, 40, 72, 58, 88, 65, 95, 78, 100].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm opacity-70 transition-all"
                style={{
                  height: `${h}%`,
                  background: h > 70
                    ? 'var(--color-gain)'
                    : h > 45
                    ? 'var(--color-brand)'
                    : 'var(--color-loss)',
                }}
              />
            ))}
          </div>

          <div>
            <h2 className="text-2xl font-bold leading-tight text-[var(--color-text-primary)]">
              The trading journal that pays off
            </h2>
            <p className="mt-3 text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Track every trade, identify your edge, and grow your account — completely free.
            </p>
          </div>

          <ul className="space-y-3">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-[var(--color-text-secondary)]">
                <CheckCircle2 size={15} className="shrink-0 text-[var(--color-gain)]" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom stat */}
        <div className="z-10 flex items-center gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-100)] p-4">
          <BarChart3 size={24} className="shrink-0 text-[var(--color-brand)]" />
          <div>
            <p className="text-xs font-semibold text-[var(--color-text-primary)]">Analytics built for traders</p>
            <p className="text-xs text-[var(--color-text-muted)]">Win rate · Profit factor · Drawdown · Expectancy</p>
          </div>
        </div>
      </div>

      {/* ── Mobile: compact brand header ─────────────────────────────────────── */}
      <div className="lg:hidden fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-2.5 border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-sm px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-brand)]">
            <TrendingUp size={14} className="text-white" />
          </div>
          <span className="text-base font-bold tracking-tight text-[var(--color-text-primary)]">Tradiary</span>
        </Link>
      </div>

      {/* ── Right: Form Panel ─────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 lg:py-10">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
