/**
 * pages/LandingPage.jsx
 * Full public-facing marketing page for Tradiary.
 * Sections: Nav, Hero, Features, How it works, Free trust section, Footer.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowRight,
  BarChart2,
  BookOpen,
  CalendarDays,
  BookMarked,
  Calculator,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Shield,
  Zap,
  Menu,
  X,
  Sun,
  Moon,
  ChevronDown,
  LayoutDashboard,
  Plug2,
  Download,
  Activity,
  RefreshCw,
  Lock,
  Film,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
  Target,
} from 'lucide-react';
import { toggleTheme, setTheme, selectTheme } from '@/features/ui/uiSlice';
import { selectCurrentUser, selectBootstrapped, refreshSession } from '@/features/auth/authSlice';
import Logo from '@/components/ui/Logo';
import Button from '@/components/ui/Button';

// ── Social links ─────────────────────────────────────────────────────────────
const SOCIAL_LINKS = [
  {
    id: 'social-x',
    label: 'Follow us on X (Twitter)',
    href: 'https://www.x.com/AdeolaSiyanbola',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L2.25 2.25h6.978l4.258 5.63 4.758-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    id: 'social-instagram',
    label: 'Follow us on Instagram',
    href: 'https://www.instagram.com/shimbo.jr',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  {
    id: 'social-linkedin',
    label: 'Connect on LinkedIn',
    href: 'https://www.linkedin.com/in/shimbojr',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    id: 'social-youtube',
    label: 'Watch us on YouTube',
    href: 'https://youtube.com/@shimbojr',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
];

// ── Mini equity curve SVG ─────────────────────────────────────────────────────
const CURVE = [12, 20, 16, 32, 28, 45, 38, 55, 48, 65, 58, 78, 70, 88, 82, 96];
function buildCurve(pts, w = 360, h = 100) {
  const sx = w / (pts.length - 1);
  const max = Math.max(...pts);
  const coords = pts.map((y, i) => [+(i * sx).toFixed(1), +(h - (y / max) * (h - 8)).toFixed(1)]);
  const line = coords.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ');
  const last = coords[coords.length - 1];
  const area = `${line} L${last[0]},${h} L0,${h} Z`;
  return { line, area, pts: coords };
}
const { line: CURVE_LINE, area: CURVE_AREA, pts: CURVE_PTS } = buildCurve(CURVE);

// ── Feature cards ─────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: BookOpen,
    title: 'Frictionless Trade Logging',
    desc: 'Log entries and exits in seconds. Add screenshots, emotion tags, mistake tags, and post-trade notes. Every detail captured, nothing forgotten.',
    badge: 'Core',
  },
  {
    icon: BarChart2,
    title: 'Deep Analytics Dashboard',
    desc: 'Win rate, profit factor, expectancy, average winner/loser, and max drawdown — the metrics that matter, visualised on an equity curve.',
    badge: 'Analytics',
  },
  {
    icon: BookMarked,
    title: 'Playbooks',
    desc: 'Document your setups and strategies. Link trades to playbooks to see which edge works and what needs refining over time.',
    badge: 'Strategy',
  },
  {
    icon: CalendarDays,
    title: 'Calendar P&L View',
    desc: 'See every trading day colour-coded by daily P&L. Instantly spot overtrading, losing streaks, and your best sessions.',
    badge: 'Insights',
  },
  {
    icon: Calculator,
    title: 'Risk Calculator',
    desc: 'Position-size any trade in seconds. Enter your account size, risk %, and stop distance — get exact share/contract size back.',
    badge: 'Tools',
  },
  {
    icon: Film,
    title: 'Trade Replay',
    desc: 'Replay any closed trade on a real candlestick chart. Watch price action unfold candle-by-candle with SL/TP lines, entry & exit markers, and full playback controls.',
    badge: 'New ✨',
    highlight: true,
  },
  {
    icon: Plug2,
    title: 'MetaTrader 5 Auto-Sync',
    desc: 'Attach our free EA to any chart and every trade — entry, exit, SL/TP, and P&L — is logged in Tradiary automatically. Zero manual entry.',
    badge: 'MT5',
  },
  {
    icon: Shield,
    title: 'Completely Free. Always.',
    desc: 'Tradiary is a passion project built to make disciplined trading accessible to everyone, globally. No subscription, no credit card, no catch.',
    badge: 'Free',
  },
];

// ── MetaTrader setup steps ────────────────────────────────────────────────────
const MT_STEPS = [
  {
    step: '01',
    icon: Download,
    title: 'Download the EA',
    desc: 'Grab the free Tradiary Bridge EA (.mq5) from Settings → Integrations. One file, no dependencies.',
  },
  {
    step: '02',
    icon: Plug2,
    title: 'Attach to any chart',
    desc: 'Drop the EA onto any one chart in MT5. It monitors all deals globally — you only need it on one chart.',
  },
  {
    step: '03',
    icon: Lock,
    title: 'Paste your API token',
    desc: 'Generate a token in Tradiary → Settings → Integrations and paste it into the EA inputs. Done.',
  },
  {
    step: '04',
    icon: Activity,
    title: 'Trade — we do the rest',
    desc: 'Every trade is captured the instant it executes — entry, exit, SL, TP, and P&L calculated automatically.',
  },
];

// ── Stat strip ────────────────────────────────────────────────────────────────
const STATS = [
  { value: '100%', label: 'Free, always' },
  { value: '∞',   label: 'Trades logged' },
  { value: '12+',  label: 'Analytics metrics' },
  { value: '0',    label: 'Credit cards needed' },
];

// ── How it works steps ────────────────────────────────────────────────────────
const HOW_STEPS = [
  {
    step: '01',
    title: 'Create your free account',
    desc: 'Sign up with email or Google in under 30 seconds. No credit card, no trial period.',
  },
  {
    step: '02',
    title: 'Log your first trade',
    desc: 'Enter symbol, direction, entry/exit prices, and any notes. Your P&L and R-multiple calculate automatically.',
  },
  {
    step: '03',
    title: 'Review your analytics',
    desc: 'Watch your equity curve take shape. Identify what works, fix what doesn\'t, and compound your edge.',
  },
];

// ── Sample trade cards ────────────────────────────────────────────────────────
const SAMPLE_TRADES = [
  { symbol: 'AAPL', dir: 'LONG',  pnl: +342.50, r: '+2.3R' },
  { symbol: 'TSLA', dir: 'SHORT', pnl: -185.00, r: '-1.2R' },
  { symbol: 'SPY',  dir: 'LONG',  pnl: +615.00, r: '+4.1R' },
];

// ─────────────────────────────────────────────────────────────────────────────


const LandingPage = () => {
  const dispatch = useDispatch();
  const theme    = useSelector(selectTheme);
  const user     = useSelector(selectCurrentUser);
  const bootstrapped = useSelector(selectBootstrapped);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Bootstrap session silently — ProtectedRoute normally does this,
  // but on the public landing page it's never mounted, so auth.user stays
  // null even when the refresh cookie is still valid.
  useEffect(() => {
    if (!bootstrapped) {
      dispatch(refreshSession());
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Landing-page light-mode default ────────────────────────────────────────
  // On first visit (no explicit user preference recorded for the landing page),
  // default to light mode. Once the user toggles, we record their choice and
  // always respect it. The app/dashboard is unaffected — it uses the account's
  // saved theme loaded from the server on login.
  useEffect(() => {
    const hasUserSetLandingTheme =
      localStorage.getItem('tradiary_landing_theme_set') === 'true';
    if (!hasUserSetLandingTheme) {
      dispatch(setTheme('light'));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--text)]">

      {/* ═══════════════════════════════════════════════════════ NAVBAR ══ */}
      <nav className={[
        'sticky top-0 z-50 transition-all duration-200',
        scrolled
          ? 'border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-md shadow-card'
          : 'bg-transparent',
      ].join(' ')}>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <Link to="/" aria-label="Tradiary home">
            <Logo variant="full" size={30} />
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6 text-sm text-[var(--text-muted)]">
            <a href="#features" className="hover:text-[var(--text)] transition-colors">Features</a>
            <a
              href="#trade-replay"
              className="flex items-center gap-1.5 rounded-full border border-[var(--brand-indigo)]/30 bg-[var(--brand-indigo-subtle)] px-3 py-1 text-xs font-semibold transition-colors hover:border-[var(--brand-indigo)]/60"
              style={{ color: 'var(--brand-indigo)' }}
            >
              <Film size={11} />
              Trade Replay
            </a>
            <a
              href="#metatrader"
              className="flex items-center gap-1.5 rounded-full border border-[var(--brand-cyan)]/30 bg-[var(--brand-cyan-subtle)] px-3 py-1 text-xs font-semibold transition-colors hover:border-[var(--brand-cyan)]/60"
              style={{ color: 'var(--brand-cyan)' }}
            >
              <Plug2 size={11} />
              MT5 Integration
            </a>
            <a href="#how-it-works" className="hover:text-[var(--text)] transition-colors">How it works</a>
            <a href="#free" className="hover:text-[var(--text)] transition-colors">Pricing</a>
            {user && (
              <Link
                to="/app/dashboard"
                id="nav-dashboard-link"
                className="flex items-center gap-1.5 rounded-lg border border-[var(--brand-indigo)]/40 bg-[var(--brand-indigo-subtle)] px-3 py-1.5 text-xs font-semibold text-[var(--brand-indigo)] transition-all hover:bg-[var(--brand-indigo)] hover:text-white hover:border-transparent"
              >
                <LayoutDashboard size={13} />
                Dashboard
              </Link>
            )}
          </div>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => {
                localStorage.setItem('tradiary_landing_theme_set', 'true');
                dispatch(toggleTheme());
              }}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-100)] transition-all"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <Link to="/signin">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm">Get started free</Button>
            </Link>
          </div>

          {/* Mobile actions */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => {
                localStorage.setItem('tradiary_landing_theme_set', 'true');
                dispatch(toggleTheme());
              }}
              aria-label="Toggle theme"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-100)]"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(v => !v)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-100)]"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[var(--border)] bg-[var(--surface)] px-4 py-4 space-y-2 animate-fade-in">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)]">Features</a>
            <a href="#trade-replay" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-1.5 py-2 text-sm font-semibold" style={{ color: 'var(--brand-indigo)' }}>
              <Film size={13} /> Trade Replay
            </a>
            <a href="#metatrader" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-1.5 py-2 text-sm font-semibold" style={{ color: 'var(--brand-cyan)' }}>
              <Plug2 size={13} /> MT5 Integration
            </a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)]">How it works</a>
            <a href="#free" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)]">Pricing</a>
            {user && (
              <Link
                to="/app/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-[var(--brand-indigo)] transition-colors hover:bg-[var(--brand-indigo)] hover:text-white"
              >
                <LayoutDashboard size={14} /> Dashboard
              </Link>
            )}
            <div className="flex gap-2 pt-2">
              <Link to="/signin" className="flex-1">
                <Button variant="secondary" size="sm" className="w-full">Sign in</Button>
              </Link>
              <Link to="/signup" className="flex-1">
                <Button size="sm" className="w-full">Get started</Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ═══════════════════════════════════════════════════════ HERO ══════ */}
      <section className="relative overflow-hidden px-4 pt-20 pb-28 sm:px-6 sm:pt-28 sm:pb-36 text-center">
        {/* Ambient background glows */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[600px] w-[800px] rounded-full bg-[var(--brand-indigo)] opacity-[0.07] blur-[120px]" />
          <div className="absolute top-1/4 right-0 h-[400px] w-[400px] rounded-full bg-[var(--brand-cyan)] opacity-[0.05] blur-[100px]" />
        </div>

        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[var(--brand-indigo)]/30 bg-[var(--brand-indigo-subtle)] px-4 py-1.5 text-xs font-semibold text-[var(--brand-indigo)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-indigo)] animate-pulse-soft" />
          Free forever — no credit card required
        </div>

        {/* Headline */}
        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl font-display">
          Your trading diary,{' '}
          <span style={{ color: 'var(--brand-cyan)' }}>with analytics.</span>
        </h1>

        <p className="mt-6 mx-auto max-w-xl text-base text-[var(--text-muted)] sm:text-lg leading-relaxed">
          The free, no-catch trading journal for serious traders.
          Log trades, review your edge, and improve — with deep analytics built in.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link to="/signup">
            <Button
              size="lg"
              rightIcon={<ArrowRight size={18} />}
              className="shadow-glow"
            >
              Get started free
            </Button>
          </Link>
          <a href="#how-it-works">
            <Button variant="secondary" size="lg">
              See how it works
            </Button>
          </a>
        </div>

        {/* Stats strip */}
        <div className="mt-20 flex flex-wrap items-center justify-center gap-10 sm:gap-16">
          {STATS.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-3xl font-extrabold font-display gradient-text">{value}</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">{label}</p>
            </div>
          ))}
        </div>

        {/* Hero dashboard illustration */}
        <div className="mt-20 relative mx-auto max-w-3xl">
          {/* Glow under the card */}
          <div aria-hidden="true" className="absolute -bottom-8 left-1/2 -translate-x-1/2 h-20 w-3/4 bg-[var(--brand-indigo)] opacity-20 blur-3xl rounded-full" />

          <div className="relative rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_24px_64px_rgba(0,0,0,0.4)] overflow-hidden">
            {/* Mock topbar */}
            <div className="flex items-center gap-1.5 border-b border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3">
              <div className="h-2.5 w-2.5 rounded-full bg-[var(--loss)]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[var(--warning)]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[var(--gain)]" />
              <span className="ml-3 text-xs text-[var(--text-muted)]">tradiary.app/app/dashboard</span>
            </div>

            {/* Mock dashboard content */}
            <div className="p-4 sm:p-6">
              {/* Stat cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                {[
                  { label: 'Net P&L', value: '+$5,840', gain: true },
                  { label: 'Win Rate', value: '64%', neutral: true },
                  { label: 'Profit Factor', value: '2.1', neutral: true },
                  { label: 'Max Drawdown', value: '-8.2%', loss: true },
                ].map(({ label, value, gain, loss }) => (
                  <div key={label} className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-3">
                    <p className="text-[10px] text-[var(--text-muted)] mb-1">{label}</p>
                    <p className={`text-base font-bold font-mono ${gain ? 'text-[var(--gain-text)]' : loss ? 'text-[var(--loss-text)]' : 'text-[var(--text)]'}`}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Equity curve */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Equity Curve</p>
                  <span className="text-xs text-[var(--gain-text)] font-medium">↑ All time</span>
                </div>
                <svg viewBox="0 0 360 100" className="w-full" role="img" aria-label="Sample equity curve">
                  <defs>
                    <linearGradient id="hero-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--gain)" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="var(--gain)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d={CURVE_AREA} fill="url(#hero-fill)" />
                  <path d={CURVE_LINE} fill="none" stroke="var(--gain)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  {/* Last point dot */}
                  {CURVE_PTS.length > 0 && (
                    <circle cx={CURVE_PTS[CURVE_PTS.length - 1][0]} cy={CURVE_PTS[CURVE_PTS.length - 1][1]} r="4" fill="var(--gain)" />
                  )}
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════ FEATURES ════════ */}
      <section id="features" className="px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--brand-indigo)] mb-3">Features</p>
            <h2 className="text-3xl font-extrabold font-display sm:text-4xl">
              Everything a serious trader needs
            </h2>
            <p className="mt-4 text-[var(--text-muted)] max-w-xl mx-auto">
              The same analytical depth as premium tools like TradeZella and Edgewonk — completely free.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, desc, badge, highlight }) => (
              <div
                key={title}
                className={[
                  'group rounded-2xl border p-6 transition-all duration-200',
                  highlight
                    ? 'border-[var(--brand-indigo)]/40 bg-gradient-to-br from-[var(--brand-indigo-subtle)] to-[var(--surface)] hover:shadow-glow'
                    : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--brand-indigo)]/30 hover:shadow-card-hover',
                ].join(' ')}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${highlight ? 'bg-gradient-to-br from-[var(--brand-indigo)] to-[var(--brand-cyan)]' : 'bg-[var(--surface-100)] group-hover:bg-[var(--brand-indigo-subtle)]'} transition-colors`}>
                    <Icon size={18} className={highlight ? 'text-white' : 'text-[var(--text-muted)] group-hover:text-[var(--brand-indigo)]'} />
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${highlight ? 'bg-[var(--brand-indigo)] text-white' : 'bg-[var(--surface-100)] text-[var(--text-muted)]'}`}>
                    {badge}
                  </span>
                </div>
                <h3 className="mb-2 font-semibold text-[var(--text)]">{title}</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════ METATRADER SECTION ═══════ */}
      <section id="metatrader" className="relative px-4 py-24 sm:px-6 border-t border-[var(--border)] overflow-hidden">
        {/* Ambient glows */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/2 left-0 -translate-y-1/2 h-[600px] w-[600px] rounded-full opacity-[0.06] blur-[130px]" style={{ background: 'var(--brand-indigo)' }} />
          <div className="absolute top-1/3 right-0 h-[500px] w-[500px] rounded-full opacity-[0.05] blur-[120px]" style={{ background: 'var(--brand-cyan)' }} />
        </div>

        <div className="mx-auto max-w-6xl relative">

          {/* Section header */}
          <div className="text-center mb-16">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold"
                 style={{ borderColor: 'rgba(34,211,238,0.3)', background: 'rgba(34,211,238,0.08)', color: 'var(--brand-cyan)' }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--brand-cyan)', animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite' }} />
              New — MetaTrader 5 Integration
            </div>
            <h2 className="text-3xl font-extrabold font-display sm:text-4xl lg:text-5xl mb-5">
              Your MT5 trades, journaled{' '}
              <span style={{ color: 'var(--brand-cyan)' }}>automatically.</span>
            </h2>
            <p className="text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed sm:text-lg">
              Stop manually logging trades. Our free Expert Advisor bridges MetaTrader 5 directly
              to Tradiary — every deal captured in real time, including Stop Loss and Take Profit.
            </p>
          </div>

          {/* Main feature card */}
          <div className="rounded-2xl border overflow-hidden mb-16 shadow-[0_32px_80px_rgba(0,0,0,0.45)]"
               style={{ borderColor: 'var(--border)', background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface-raised) 100%)' }}>
            <div className="grid lg:grid-cols-2">

              {/* ── Left panel: copy + CTA ── */}
              <div className="p-8 sm:p-10 flex flex-col justify-center">
                {/* MT5 identity row */}
                <div className="mb-7 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl font-black text-sm shadow-lg select-none"
                       style={{ background: 'linear-gradient(135deg, var(--brand-indigo), var(--brand-cyan))', color: '#fff', letterSpacing: '-0.03em', fontSize: '15px' }}>
                    MT5
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--brand-cyan)' }}>Tradiary Bridge EA</p>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Expert Advisor v1.2 · Free forever · .mq5</p>
                  </div>
                </div>

                <h3 className="text-xl font-bold mb-3 sm:text-2xl leading-snug" style={{ color: 'var(--text)' }}>
                  Trade in MT5 — journal entries appear in Tradiary instantly.
                </h3>
                <p className="text-sm leading-relaxed mb-7" style={{ color: 'var(--text-muted)' }}>
                  The EA hooks into MT5’s order pipeline. Instant orders, limit orders,
                  post-fill SL/TP modifications — every event is securely pushed to your
                  Tradiary account via a personal API token. Zero manual entry.
                </p>

                {/* Feature pills */}
                <div className="flex flex-wrap gap-2 mb-8">
                  {[
                    { icon: RefreshCw, label: 'Real-time sync' },
                    { icon: Activity,  label: 'SL & TP captured' },
                    { icon: Lock,      label: 'Token-secured webhook' },
                    { icon: Zap,       label: 'Instant & Limit orders' },
                  ].map(({ icon: PillIcon, label }) => (
                    <span key={label}
                      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
                      style={{ borderColor: 'var(--border)', background: 'var(--surface-100)', color: 'var(--text-muted)' }}>
                      <PillIcon size={11} style={{ color: 'var(--brand-cyan)' }} />
                      {label}
                    </span>
                  ))}
                </div>

                {/* CTAs */}
                <div className="flex flex-wrap gap-3">
                  <a
                    href="/downloads/tradiary-bridge.mq5"
                    download
                    id="mt-download-ea-btn"
                    className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:scale-[1.02] active:scale-95"
                    style={{ background: 'linear-gradient(135deg, var(--brand-indigo) 0%, var(--brand-cyan) 100%)' }}
                  >
                    <Download size={15} />
                    Download Free EA
                  </a>
                  <a
                    href="#metatrader-steps"
                    id="mt-setup-guide-btn"
                    className="inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition-all duration-200"
                    style={{ borderColor: 'var(--border)', background: 'var(--surface-200)', color: 'var(--text)' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(91,108,255,0.4)'; e.currentTarget.style.color = 'var(--brand-indigo)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text)'; }}
                  >
                    Setup guide ↓
                  </a>
                </div>
              </div>

              {/* ── Right panel: live feed mock ── */}
              <div className="relative flex flex-col justify-center p-8 sm:p-10 border-t lg:border-t-0 lg:border-l"
                   style={{ borderColor: 'var(--border)', background: 'linear-gradient(135deg, rgba(91,108,255,0.04), rgba(34,211,238,0.04))' }}>

                <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>Live webhook feed — preview</p>

                {/* Pipeline visualization */}
                <div className="flex items-center gap-2 mb-5">
                  <div className="flex h-8 w-14 items-center justify-center rounded-lg border text-[10px] font-bold"
                       style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--brand-indigo)' }}>
                    MT5
                  </div>
                  <div className="flex-1 flex items-center justify-between px-1">
                    {[0,1,2,3,4,5].map(i => (
                      <span key={i}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{
                          background: 'var(--brand-cyan)',
                          animation: `mt-dot-flow 1.8s ${i * 0.3}s infinite`,
                          opacity: 0,
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex h-8 w-20 items-center justify-center rounded-lg border text-[10px] font-bold"
                       style={{ borderColor: 'rgba(91,108,255,0.3)', background: 'var(--brand-indigo-subtle)', color: 'var(--brand-indigo)' }}>
                    Tradiary
                  </div>
                </div>

                {/* Event log cards */}
                {[
                  {
                    time: '21:16:02',
                    event: 'trade_open',
                    symbol: 'XAUUSD.S',
                    tags: [{ label: 'LONG' }, { label: '@4,174.14' }, { label: 'SL 4,160.00', warn: true }],
                    accent: 'var(--gain)',
                  },
                  {
                    time: '21:16:45',
                    event: 'trade_modify',
                    symbol: 'XAUUSD.S',
                    tags: [{ label: 'SL → 4,162.50', warn: true }, { label: 'TP → 4,205.00', pos: true }],
                    accent: 'var(--brand-cyan)',
                  },
                  {
                    time: '21:19:11',
                    event: 'trade_close',
                    symbol: 'XAUUSD.S',
                    tags: [{ label: '@4,171.89' }, { label: 'P&L −4.50', neg: true }],
                    accent: 'var(--loss)',
                  },
                ].map(({ time, event, symbol, tags, accent }, i) => (
                  <div
                    key={event + i}
                    className="mb-2.5 last:mb-0 rounded-xl border px-4 py-3"
                    style={{
                      borderColor: 'var(--border)',
                      background: 'var(--surface)',
                      animation: `mt-card-in 0.45s ${0.1 + i * 0.15}s both`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>{time}</span>
                      <span className="text-[10px] font-semibold rounded-full px-2 py-0.5"
                            style={{ color: accent, background: accent + '1a' }}>
                        {event}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold" style={{ color: 'var(--text)' }}>{symbol}</span>
                      {tags.map(({ label, warn, pos, neg }) => (
                        <span key={label} className="text-[10px] font-mono"
                              style={{ color: warn ? 'var(--loss-text)' : pos ? 'var(--gain-text)' : neg ? 'var(--loss-text)' : 'var(--text-muted)' }}>
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Live status dot */}
                <div className="mt-5 flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full opacity-75"
                          style={{ background: 'var(--gain)', animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite' }} />
                    <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: 'var(--gain)' }} />
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Bridge active — listening for deals…</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── 4-step setup guide ── */}
          <div id="metatrader-steps">
            <p className="text-center text-xs font-bold uppercase tracking-widest mb-10" style={{ color: 'var(--brand-indigo)' }}>
              Setup in 4 steps · Under 5 minutes
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {MT_STEPS.map(({ step, icon: StepIcon, title, desc }, i) => (
                <div key={step}
                  className="group relative rounded-2xl border p-6 transition-all duration-200 hover:shadow-[0_8px_32px_rgba(91,108,255,0.14)]"
                  style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(91,108,255,0.4)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  {/* Connector line between cards (hidden on last) */}
                  {i < 3 && (
                    <div className="absolute top-10 -right-2.5 hidden lg:block w-5 h-px" style={{ background: 'var(--border)' }} />
                  )}
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors"
                         style={{ background: 'var(--surface-100)' }}
                         onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand-indigo-subtle)'; }}
                         onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-100)'; }}>
                      <StepIcon size={18} style={{ color: 'var(--text-muted)' }} />
                    </div>
                    <span className="text-2xl font-black font-mono" style={{ color: 'var(--border)' }}>{step}</span>
                  </div>
                  <h3 className="mb-2 font-semibold" style={{ color: 'var(--text)' }}>{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                </div>
              ))}
            </div>

            {/* Bottom CTA row */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/downloads/tradiary-bridge.mq5"
                download
                id="mt-download-ea-btn-2"
                className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:scale-[1.02] active:scale-95"
                style={{ background: 'linear-gradient(135deg, var(--brand-indigo), var(--brand-cyan))' }}
              >
                <Download size={15} />
                Download the EA — it’s free
              </a>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Requires MetaTrader 5 · Works with any broker</p>
            </div>
          </div>
        </div>

        {/* Keyframe animations injected inline (no build step needed) */}
        <style>{`
          @keyframes mt-dot-flow {
            0%   { opacity: 0; transform: translateX(-4px); }
            40%  { opacity: 1; transform: translateX(0); }
            70%  { opacity: 1; transform: translateX(0); }
            100% { opacity: 0; transform: translateX(4px); }
          }
          @keyframes mt-card-in {
            from { opacity: 0; transform: translateY(10px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes ping {
            75%, 100% { transform: scale(2); opacity: 0; }
          }
        `}</style>
      </section>

      {/* ═══════════════════════════════════ TRADE REPLAY SECTION ══════════ */}
      <section id="trade-replay" className="relative px-4 py-24 sm:px-6 border-t border-[var(--border)] overflow-hidden">
        {/* Ambient glows */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/4 left-1/4 h-[500px] w-[500px] rounded-full opacity-[0.07] blur-[130px]" style={{ background: 'var(--brand-indigo)' }} />
          <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full opacity-[0.05] blur-[120px]" style={{ background: '#8B5CF6' }} />
        </div>

        <div className="mx-auto max-w-6xl relative">

          {/* Section header */}
          <div className="text-center mb-16">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold"
                 style={{ borderColor: 'rgba(99,102,241,0.35)', background: 'rgba(99,102,241,0.10)', color: 'var(--brand-indigo)' }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--brand-indigo)', animation: 'pulse-dot 1.5s cubic-bezier(0,0,0.2,1) infinite' }} />
              New — Trade Replay
            </div>
            <h2 className="text-3xl font-extrabold font-display sm:text-4xl lg:text-5xl mb-5">
              Relive every trade,{' '}
              <span style={{ background: 'linear-gradient(135deg, var(--brand-indigo), #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>candle by candle.</span>
            </h2>
            <p className="text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed sm:text-lg">
              Go beyond static logs. Replay any closed trade on a real candlestick chart and see exactly
              how price moved — from 50 candles before your entry to 20 candles past your exit.
            </p>
          </div>

          {/* ── Main feature card ── */}
          <div className="rounded-2xl border overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.45)] mb-16"
               style={{ borderColor: 'rgba(99,102,241,0.25)', background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface-raised) 100%)' }}>
            <div className="grid lg:grid-cols-2">

              {/* ── Left: copy + feature bullets ── */}
              <div className="p-8 sm:p-10 flex flex-col justify-center">
                {/* Identity row */}
                <div className="mb-7 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg"
                       style={{ background: 'linear-gradient(135deg, var(--brand-indigo), #8B5CF6)' }}>
                    <Film size={22} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--brand-indigo)' }}>Trade Replay</p>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Powered by Yahoo Finance · 6 timeframes · Real candlestick data</p>
                  </div>
                </div>

                <h3 className="text-xl font-bold mb-3 sm:text-2xl leading-snug" style={{ color: 'var(--text)' }}>
                  See your trades the way the market saw them.
                </h3>
                <p className="text-sm leading-relaxed mb-7" style={{ color: 'var(--text-muted)' }}>
                  Open any closed trade and switch to the Replay tab. Tradiary fetches real OHLCV candle data
                  and plots your entry, exit, stop loss, and take profit directly on the chart — then lets
                  you scrub through time to review your decision-making, frame by frame.
                </p>

                {/* Feature pills */}
                <div className="flex flex-wrap gap-2 mb-8">
                  {[
                    { icon: SlidersHorizontal, label: '6 timeframes (1m → 1d)' },
                    { icon: Target,            label: 'SL & TP price lines' },
                    { icon: Play,              label: 'Playback + scrubber' },
                    { icon: Activity,          label: 'Entry & exit markers' },
                  ].map(({ icon: PillIcon, label }) => (
                    <span key={label}
                      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
                      style={{ borderColor: 'var(--border)', background: 'var(--surface-100)', color: 'var(--text-muted)' }}>
                      <PillIcon size={11} style={{ color: 'var(--brand-indigo)' }} />
                      {label}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <div className="flex flex-wrap gap-3">
                  <a
                    href="/signup"
                    id="replay-cta-signup"
                    className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:scale-[1.02] active:scale-95"
                    style={{ background: 'linear-gradient(135deg, var(--brand-indigo) 0%, #8B5CF6 100%)' }}
                  >
                    <Film size={15} />
                    Try Trade Replay free
                  </a>
                  <a
                    href="#how-it-works"
                    id="replay-how-link"
                    className="inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition-all duration-200"
                    style={{ borderColor: 'var(--border)', background: 'var(--surface-200)', color: 'var(--text)' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; e.currentTarget.style.color = 'var(--brand-indigo)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text)'; }}
                  >
                    How it works ↓
                  </a>
                </div>
              </div>

              {/* ── Right: animated mock replay UI ── */}
              <div className="relative flex flex-col justify-start p-6 sm:p-8 border-t lg:border-t-0 lg:border-l gap-3"
                   style={{ borderColor: 'rgba(99,102,241,0.18)', background: 'linear-gradient(135deg, rgba(99,102,241,0.04), rgba(139,92,246,0.04))' }}>

                {/* Mock topbar */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>XAUUSD · 5m</span>
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold" style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--brand-indigo)' }}>
                      <span className="h-1 w-1 rounded-full" style={{ background: 'var(--brand-indigo)', animation: 'pulse-dot 1.5s ease-in-out infinite' }} />
                      REPLAY
                    </span>
                  </div>
                  {/* Timeframe bar mock */}
                  <div className="flex items-center gap-0.5">
                    {['1m','5m','15m','1h','1d'].map((tf, i) => (
                      <span key={tf}
                        className="px-2 py-0.5 rounded text-[9px] font-semibold transition-all"
                        style={{
                          background: i === 1 ? 'var(--brand-indigo)' : 'transparent',
                          color: i === 1 ? '#fff' : 'var(--text-muted)',
                          opacity: i === 0 ? 0.4 : 1,
                        }}
                      >{tf}</span>
                    ))}
                  </div>
                </div>

                {/* Mock candlestick chart */}
                <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                  <svg viewBox="0 0 380 200" className="w-full" role="img" aria-label="Trade replay candlestick chart preview">
                    {/* Grid lines */}
                    {[40,80,120,160].map(y => (
                      <line key={y} x1="0" y1={y} x2="380" y2={y} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="2 4" opacity="0.6"/>
                    ))}
                    {/* SL line (red dashed) */}
                    <line x1="0" y1="158" x2="380" y2="158" stroke="#EF4444" strokeWidth="1" strokeDasharray="4 3" opacity="0.8"/>
                    <rect x="340" y="151" width="38" height="12" rx="2" fill="#EF444422"/>
                    <text x="344" y="160" fill="#EF4444" fontSize="7" fontFamily="monospace">SL</text>
                    {/* TP line (green dashed) */}
                    <line x1="0" y1="38" x2="380" y2="38" stroke="#22C55E" strokeWidth="1" strokeDasharray="4 3" opacity="0.8"/>
                    <rect x="340" y="31" width="38" height="12" rx="2" fill="#22C55E22"/>
                    <text x="344" y="40" fill="#22C55E" fontSize="7" fontFamily="monospace">TP</text>
                    {/* Candles - before entry (dimmed/revealed) */}
                    {[
                      [14,105,85,115,78],[28,115,90,118,84],[42,110,88,113,82],
                      [56,120,92,122,88],[70,115,95,118,90],[84,118,100,121,94],
                      [98,112,98,115,92],[112,108,105,112,100],[126,118,104,120,100],
                      [140,114,108,117,103],[154,120,110,123,106],[168,116,112,119,108],
                    ].map(([x, open, close, high, low], i) => {
                      const isGreen = close > open;
                      const color = isGreen ? '#22C55E' : '#EF4444';
                      const bodyTop = Math.min(open, close);
                      const bodyH = Math.abs(open - close) || 1;
                      return (
                        <g key={x} style={{ opacity: i < 9 ? 0.55 : 1 }}>
                          <line x1={x+7} y1={high} x2={x+7} y2={low} stroke={color} strokeWidth="1"/>
                          <rect x={x+1} y={bodyTop} width="12" height={bodyH} rx="1" fill={color} opacity="0.9"/>
                        </g>
                      );
                    })}
                    {/* Entry arrow marker */}
                    <polygon points="182,133 188,125 194,133" fill="#6366F1" opacity="0.95"/>
                    <text x="170" y="143" fill="#6366F1" fontSize="7" fontFamily="monospace">Entry</text>
                    {/* Candles - after entry (revealed, vibrant) */}
                    {[
                      [182,112,118,120,108],[196,118,115,122,112],[210,115,120,123,112],
                      [224,120,126,128,117],[238,126,122,129,119],[252,122,128,131,118],
                      [266,128,124,133,121],[280,124,130,135,120],[294,130,127,136,124],
                    ].map(([x, open, close, high, low], i) => {
                      const isGreen = close > open;
                      const color = isGreen ? '#22C55E' : '#EF4444';
                      const bodyTop = Math.min(open, close);
                      const bodyH = Math.abs(open - close) || 1;
                      return (
                        <g key={x}>
                          <line x1={x+7} y1={high} x2={x+7} y2={low} stroke={color} strokeWidth="1"/>
                          <rect x={x+1} y={bodyTop} width="12" height={bodyH} rx="1" fill={color} opacity="0.95"/>
                        </g>
                      );
                    })}
                    {/* Exit arrow marker */}
                    <polygon points="296,118 302,126 308,118" fill="#22D3EE" opacity="0.95"/>
                    <text x="284" y="115" fill="#22D3EE" fontSize="7" fontFamily="monospace">Exit</text>
                    {/* Unrevealed candles (greyed out / future) */}
                    {[
                      [310,127,124,130,121],[324,124,121,127,118],[338,121,118,124,115],[352,118,115,121,112]
                    ].map(([x, open, close, high, low]) => (
                      <g key={x} opacity="0.18">
                        <line x1={x+7} y1={high} x2={x+7} y2={low} stroke="var(--text-muted)" strokeWidth="1"/>
                        <rect x={x+1} y={Math.min(open,close)} width="12" height={Math.abs(open-close)||1} rx="1" fill="var(--text-muted)"/>
                      </g>
                    ))}
                    {/* Vertical entry line */}
                    <line x1="188" y1="0" x2="188" y2="200" stroke="#6366F1" strokeWidth="0.75" strokeDasharray="3 3" opacity="0.5"/>
                    {/* Vertical exit line */}
                    <line x1="302" y1="0" x2="302" y2="200" stroke="#22D3EE" strokeWidth="0.75" strokeDasharray="3 3" opacity="0.5"/>
                    {/* P&L badge */}
                    <rect x="196" y="56" width="54" height="18" rx="4" fill="#22C55E22" stroke="#22C55E" strokeWidth="0.75"/>
                    <text x="223" y="68" fill="#22C55E" fontSize="8" fontFamily="monospace" textAnchor="middle">+$342.50</text>
                    <line x1="188" y1="65" x2="198" y2="65" stroke="#22C55E" strokeWidth="0.75" opacity="0.6"/>
                  </svg>
                </div>

                {/* Playback controls mock */}
                <div className="rounded-xl border px-4 py-3 space-y-2" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                  {/* Scrubber */}
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono w-8 text-right" style={{ color: 'var(--text-muted)' }}>21</span>
                    <div className="flex-1 relative h-1.5 rounded-full" style={{ background: 'var(--surface-200)' }}>
                      <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: '55%', background: 'linear-gradient(90deg, var(--brand-indigo), #8B5CF6)' }} />
                      <div className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full border-2 border-white shadow" style={{ left: 'calc(55% - 6px)', background: 'var(--brand-indigo)' }} />
                    </div>
                    <span className="text-[10px] font-mono w-8" style={{ color: 'var(--text-muted)' }}>38</span>
                  </div>
                  {/* Buttons */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <div className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white" style={{ background: 'var(--brand-indigo)' }}>
                      <Pause size={11} /> Pause
                    </div>
                    {/* Speed buttons */}
                    <div className="flex items-center rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                      {['0.5×','1×','2×','4×','8×'].map((s, i) => (
                        <span key={s} className="px-2 py-1.5 text-[10px] font-medium"
                              style={{ background: i === 1 ? 'var(--brand-indigo)' : 'transparent', color: i === 1 ? '#fff' : 'var(--text-muted)' }}>{s}</span>
                      ))}
                    </div>
                    <div className="flex-1" />
                    <div className="flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[10px] font-medium" style={{ borderColor: 'var(--border)', color: '#6366F1' }}>
                      <SkipBack size={10} /> Entry
                    </div>
                    <div className="flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[10px] font-medium" style={{ borderColor: 'var(--border)', color: '#22D3EE' }}>
                      Exit <SkipForward size={10} />
                    </div>
                  </div>
                </div>

                {/* Legend row */}
                <div className="flex flex-wrap items-center gap-3 text-[9px]" style={{ color: 'var(--text-muted)' }}>
                  <span className="flex items-center gap-1"><svg width="16" height="5"><line x1="0" y1="2.5" x2="16" y2="2.5" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="3 2"/></svg> SL</span>
                  <span className="flex items-center gap-1"><svg width="16" height="5"><line x1="0" y1="2.5" x2="16" y2="2.5" stroke="#22C55E" strokeWidth="1.5" strokeDasharray="3 2"/></svg> TP</span>
                  <span className="flex items-center gap-1"><span style={{ color: '#6366F1', fontSize: 11 }}>▲</span> Entry</span>
                  <span className="flex items-center gap-1"><span style={{ color: '#22D3EE', fontSize: 11 }}>▼</span> Exit</span>
                  <span className="ml-auto">38 candles · XAUUSD</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── 3-column feature callouts ── */}
          <div className="grid gap-5 sm:grid-cols-3">
            {[
              {
                icon: Film,
                title: 'Real market data',
                desc: 'Tradiary fetches authentic OHLCV data from Yahoo Finance so your replay matches the actual market, not a simulation.',
                color: 'var(--brand-indigo)',
                subtle: 'rgba(99,102,241,0.1)',
              },
              {
                icon: SlidersHorizontal,
                title: 'Six timeframes',
                desc: 'Switch between 1m, 5m, 15m, 30m, 1h, and 1d. Grayed-out timeframes indicate data beyond Yahoo Finance\'s intraday window.',
                color: '#8B5CF6',
                subtle: 'rgba(139,92,246,0.1)',
              },
              {
                icon: Target,
                title: 'Full trade context',
                desc: '50 candles before entry and 20 after exit are loaded — so you see the setup, the trade, and the aftermath clearly.',
                color: 'var(--brand-indigo)',
                subtle: 'rgba(99,102,241,0.1)',
              },
            ].map(({ icon: CalloutIcon, title, desc, color, subtle }) => (
              <div key={title}
                className="group rounded-2xl border p-6 transition-all duration-200"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = color + '50'; e.currentTarget.style.boxShadow = `0 8px 32px ${color}22`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl transition-all" style={{ background: subtle }}>
                  <CalloutIcon size={18} style={{ color }} />
                </div>
                <h3 className="mb-2 font-semibold" style={{ color: 'var(--text)' }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Inline keyframes */}
        <style>{`
          @keyframes pulse-dot {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(0.8); }
          }
        `}</style>
      </section>

      {/* ═══════════════════════════════════════════════ HOW IT WORKS ══════ */}
      <section id="how-it-works" className="px-4 py-24 sm:px-6 border-t border-[var(--border)]">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--brand-indigo)] mb-3">How it works</p>
            <h2 className="text-3xl font-extrabold font-display sm:text-4xl">
              Up and running in 2 minutes
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {HOW_STEPS.map(({ step, title, desc }) => (
              <div key={step} className="flex flex-col items-center text-center md:items-start md:text-left">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--brand-indigo)]/30 bg-[var(--brand-indigo-subtle)]">
                  <span className="text-sm font-bold font-mono" style={{ color: 'var(--brand-indigo)' }}>{step}</span>
                </div>
                <h3 className="mb-2 font-semibold text-[var(--text)]">{title}</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* Sample trade cards illustration */}
          <div className="mt-14 grid gap-3 sm:grid-cols-3">
            {SAMPLE_TRADES.map(({ symbol, dir, pnl, r }) => (
              <div key={symbol} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-[var(--text)]">{symbol}</span>
                  <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${dir === 'LONG' ? 'bg-[var(--brand-indigo-subtle)] text-[var(--brand-indigo)]' : 'bg-[var(--surface-100)] text-[var(--text-muted)]'}`}>
                    {dir}
                  </span>
                </div>
                <p className={`text-lg font-bold font-mono ${pnl >= 0 ? 'text-[var(--gain-text)]' : 'text-[var(--loss-text)]'}`}>
                  {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
                </p>
                <p className={`text-xs mt-1 ${pnl >= 0 ? 'text-[var(--gain-text)]' : 'text-[var(--loss-text)]'}`}>{r}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════ FREE SECTION ═══ */}
      <section id="free" className="px-4 py-24 sm:px-6 border-t border-[var(--border)]">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--gain)]/30 bg-[var(--gain-subtle)] px-4 py-1.5 text-xs font-semibold text-[var(--gain-text)]">
            <Zap size={12} />
            No subscription. No catch. Ever.
          </div>

          <h2 className="text-3xl font-extrabold font-display sm:text-4xl mb-6">
            Built to make disciplined trading accessible to everyone
          </h2>

          <p className="text-[var(--text-muted)] leading-relaxed mb-8 max-w-xl mx-auto">
            Tradiary is a passion project. Premium journaling tools charge $30–$80/month for analytics
            that should be freely available to every trader, everywhere. We built Tradiary so that
            isn't the case anymore.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 text-left mb-10">
            {[
              ['Unlimited trade logging', 'No caps, ever'],
              ['Full analytics dashboard', 'All metrics included'],
              ['Playbooks & journal', 'Document your process'],
              ['Cloud sync', 'Access anywhere'],
              ['Screenshot uploads', 'Attach chart images'],
              ['CSV/JSON data export', 'Your data, always yours'],
            ].map(([feature, sub]) => (
              <div key={feature} className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                <CheckCircle2 size={16} style={{ color: 'var(--brand-indigo)' }} className="shrink-0" />
                <div>
                  <p className="text-sm font-medium text-[var(--text)]">{feature}</p>
                  <p className="text-xs text-[var(--text-muted)]">{sub}</p>
                </div>
              </div>
            ))}
          </div>

          <Link to="/signup">
            <Button size="lg" rightIcon={<ArrowRight size={18} />} className="shadow-glow">
              Start journaling free
            </Button>
          </Link>
          <p className="mt-4 text-xs text-[var(--text-muted)]">No credit card required · Takes 30 seconds</p>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════ FOOTER ══════ */}
      <footer className="border-t border-[var(--border)] bg-[var(--surface)] px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <Link to="/" aria-label="Tradiary home">
              <Logo variant="full" size={24} />
            </Link>

            <nav aria-label="Footer navigation" className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[var(--text-muted)]">
              <Link to="/terms" className="hover:text-[var(--text)] transition-colors">Terms of Service</Link>
              <Link to="/privacy" className="hover:text-[var(--text)] transition-colors">Privacy Policy</Link>
              <Link to="/signin" className="hover:text-[var(--text)] transition-colors">Sign in</Link>
              <Link to="/signup" className="hover:text-[var(--text)] transition-colors">Sign up</Link>
            </nav>
          </div>

          {/* ── Social links ── */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <span className="text-xs text-[var(--text-muted)] mr-1">Follow us:</span>
            {SOCIAL_LINKS.map(({ id, label, href, icon }) => (
              <a
                key={id}
                id={id}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                title={label}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-100)] text-[var(--text-muted)] transition-all duration-200 hover:bg-[var(--brand-indigo)] hover:text-white hover:scale-110 active:scale-95"
              >
                {icon}
              </a>
            ))}
          </div>

          {/* Legal disclaimer — important for global credibility */}
          <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-xs text-[var(--text-muted)] text-center leading-relaxed">
            <strong className="text-[var(--text)]">Not financial advice</strong> — Tradiary is a journaling and educational tool only.
            Nothing on this platform constitutes investment advice, a recommendation, or solicitation to buy or sell any financial instrument.
            Trading involves significant risk of loss.
          </div>

          <p className="mt-6 text-center text-xs text-[var(--text-muted)]">
            © {new Date().getFullYear()} Tradiary. Built for traders, by traders.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
