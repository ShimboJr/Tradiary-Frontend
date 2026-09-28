/**
 * pages/LandingPage.jsx
 * Public-facing landing page placeholder.
 * Full marketing page built in a later prompt.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, ArrowRight, BarChart3, BookOpen, CalendarDays } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme, selectTheme } from '@/features/ui/uiSlice';
import { Sun, Moon } from 'lucide-react';

const FEATURES = [
  {
    icon: BarChart3,
    title: 'Deep Analytics',
    desc: 'Win rate, profit factor, expectancy, drawdown — every metric a serious trader needs.',
  },
  {
    icon: BookOpen,
    title: 'Trade Journal',
    desc: 'Log entries, exits, screenshots, tags, and post-trade notes with zero friction.',
  },
  {
    icon: CalendarDays,
    title: 'Calendar View',
    desc: 'Visualise your daily P&L at a glance and spot patterns in your trading behaviour.',
  },
];

const LandingPage = () => {
  const dispatch = useDispatch();
  const theme = useSelector(selectTheme);

  return (
    <div className="flex min-h-screen flex-col">
      {/* ── Navbar ── */}
      <nav className="border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-brand)] shadow-glow">
              <TrendingUp size={16} className="text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">Tradiary</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              id="landing-theme-toggle"
              onClick={() => dispatch(toggleTheme())}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-200)] transition-all"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <Link to="/app/dashboard">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link to="/app/dashboard">
              <Button size="sm">Get started free</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-28 text-center">
        {/* Ambient glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <div className="h-[500px] w-[900px] rounded-full bg-[var(--color-brand)] opacity-[0.06] blur-[120px]" />
        </div>

        {/* Badge */}
        <span className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-[var(--color-brand)]/30 bg-[var(--color-brand-subtle)] px-3 py-1 text-xs font-medium text-[var(--color-brand)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand)]" />
          Free forever — no credit card required
        </span>

        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-[var(--color-text-primary)] sm:text-5xl lg:text-6xl">
          The trading journal that{' '}
          <span className="text-[var(--color-brand)]">serious traders</span>{' '}
          deserve
        </h1>

        <p className="mt-6 max-w-xl text-base text-[var(--color-text-secondary)] sm:text-lg">
          Tradiary gives you the same analytical depth as premium tools like TradeZella and Edgewonk
          — completely free, forever. Built for traders everywhere.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link to="/app/dashboard">
            <Button size="lg" rightIcon={<ArrowRight size={18} />}>
              Start journaling free
            </Button>
          </Link>
          <Link to="/app/dashboard">
            <Button variant="secondary" size="lg">
              Explore the app
            </Button>
          </Link>
        </div>

        {/* Stats strip */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-10 text-center">
          {[
            { value: '100%', label: 'Free, always' },
            { value: '∞', label: 'Trades logged' },
            { value: '10+', label: 'Performance metrics' },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-3xl font-extrabold text-[var(--color-brand)]">{value}</p>
              <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="border-t border-[var(--color-border)] bg-[var(--color-surface)]/50 py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-2xl font-bold text-[var(--color-text-primary)] sm:text-3xl">
            Everything you need to trade smarter
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 transition-shadow hover:shadow-[0_4px_12px_0_rgba(0,0,0,0.4)]"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-brand-subtle)]">
                  <Icon size={20} className="text-[var(--color-brand)]" />
                </div>
                <h3 className="mb-2 font-semibold text-[var(--color-text-primary)]">{title}</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[var(--color-border)] py-8 text-center text-xs text-[var(--color-text-muted)]">
        © {new Date().getFullYear()} Tradiary. Built for traders, by traders.
      </footer>
    </div>
  );
};

export default LandingPage;
