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
} from 'lucide-react';
import { toggleTheme, selectTheme } from '@/features/ui/uiSlice';
import { selectCurrentUser, selectBootstrapped, refreshSession } from '@/features/auth/authSlice';
import Logo from '@/components/ui/Logo';
import Button from '@/components/ui/Button';

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
    icon: Plug2,
    title: 'MetaTrader 5 Auto-Sync',
    desc: 'Attach our free EA to any chart and every trade — entry, exit, SL/TP, and P&L — is logged in Tradiary automatically. Zero manual entry.',
    badge: 'New ✨',
    highlight: true,
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
              onClick={() => dispatch(toggleTheme())}
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
              onClick={() => dispatch(toggleTheme())}
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
