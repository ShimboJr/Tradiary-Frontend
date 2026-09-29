/**
 * components/layout/AuthLayout.jsx
 * Split-screen layout for all auth pages.
 * Left: brand panel with gradient, Logo, value props, and equity-curve illustration.
 * Right: form panel.
 * Mobile: compact top bar with Logo.
 */

import React, { useEffect } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { CheckCircle2 } from 'lucide-react';
import { selectTheme } from '@/features/ui/uiSlice';
import Toaster from '@/components/ui/Toast';
import Logo from '@/components/ui/Logo';

const FEATURES = [
  'Unlimited trades — always free, no credit card',
  'Win rate, profit factor, drawdown & more',
  'Google & email sign-in',
  'Fully configurable timezone & currency',
];

/* Equity curve illustration: 10-point SVG sparkline */
const CURVE_POINTS = [10, 28, 22, 45, 38, 62, 54, 80, 72, 95];
function buildPath(points, w = 280, h = 80) {
  const stepX = w / (points.length - 1);
  const maxY  = Math.max(...points);
  const coords = points.map((y, i) => [
    i * stepX,
    h - (y / maxY) * (h - 8),
  ]);
  const d = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${d} L${(coords.length - 1) * stepX},${h} L0,${h} Z`;
  return { line: d, area };
}
const { line: curveLine, area: curveArea } = buildPath(CURVE_POINTS);

const AuthLayout = () => {
  const theme = useSelector(selectTheme);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">

      {/* ── Left: Brand Panel ──────────────────────────────────────────────── */}
      <div className="relative hidden lg:flex lg:w-[460px] xl:w-[520px] flex-col justify-between overflow-hidden bg-[var(--surface)] border-r border-[var(--border)] p-10 shrink-0">
        {/* Background glows */}
        <div aria-hidden="true" className="pointer-events-none absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-[var(--brand-indigo)] opacity-10 blur-[90px]" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 -right-20 h-[300px] w-[300px] rounded-full bg-[var(--brand-cyan)] opacity-8 blur-[70px]" />

        {/* Logo */}
        <Link to="/" className="z-10 w-fit" aria-label="Tradiary home">
          <Logo variant="full" size={32} />
        </Link>

        {/* Centre content */}
        <div className="z-10 space-y-8">
          {/* Equity curve illustration */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-4">
            <p className="mb-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Account Equity</p>
            <svg viewBox="0 0 280 80" className="w-full" role="img" aria-label="Sample equity curve">
              <defs>
                <linearGradient id="auth-curve-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--gain)" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="var(--gain)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={curveArea} fill="url(#auth-curve-fill)" />
              <path d={curveLine} fill="none" stroke="var(--gain)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {/* Stat pills */}
            <div className="mt-3 flex gap-2 flex-wrap">
              {[['Win rate', '64%'], ['Profit factor', '2.1'], ['Net P&L', '+$5,840']].map(([k, v]) => (
                <span key={k} className="rounded-full bg-[var(--brand-indigo-subtle)] px-2.5 py-1 text-[11px] font-medium text-[var(--brand-indigo)]">
                  {k} {v}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold leading-tight text-[var(--text)] font-display">
              Your trading diary,{' '}
              <span style={{ color: 'var(--brand-cyan)' }}>with analytics.</span>
            </h2>
            <p className="mt-3 text-sm text-[var(--text-muted)] leading-relaxed">
              Track every trade, identify your edge, and grow your account — completely free, forever.
            </p>
          </div>

          <ul className="space-y-3">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-[var(--text-muted)]">
                <CheckCircle2 size={15} className="shrink-0" style={{ color: 'var(--brand-indigo)' }} />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom tagline */}
        <div className="z-10">
          <p className="text-xs text-[var(--text-muted)]">
            Trade. Journal. Improve.
          </p>
        </div>
      </div>

      {/* ── Mobile: compact brand header ─────────────────────────────────── */}
      <div className="lg:hidden fixed inset-x-0 top-0 z-30 flex h-14 items-center border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-sm px-4">
        <Link to="/" aria-label="Tradiary home">
          <Logo variant="full" size={24} />
        </Link>
      </div>

      {/* ── Right: Form Panel ─────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-20 lg:py-10">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>

      <Toaster />
    </div>
  );
};

export default AuthLayout;
