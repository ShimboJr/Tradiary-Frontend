/**
 * pages/app/DashboardPage.jsx
 * Analytics dashboard: filter bar, metric cards, equity curve, P&L bars,
 * breakdowns, R-distribution, drawdown chart, scatter plot, insights panel.
 * Comparison mode: side-by-side metric cards + overlaid equity curves.
 */
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  format, startOfWeek, startOfMonth, startOfQuarter, startOfYear,
  subMonths, subQuarters,
} from 'date-fns';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell, Legend,
} from 'recharts';
import {
  TrendingUp, TrendingDown, GitCompare, X, ChevronDown, Zap, AlertTriangle,
} from 'lucide-react';
import {
  fetchAnalytics, fetchComparisonAnalytics, clearComparison,
  selectAnalytics, selectComparison, selectAnalyticsStatus, selectCompStatus,
} from '@/features/analytics/analyticsSlice';
import { fetchAccounts, selectAccounts } from '@/features/accounts/accountsSlice';
import { selectTheme } from '@/features/ui/uiSlice';

// ─── Theme-aware chart colors ─────────────────────────────────────────────────

function useChartColors(theme) {
  const dark = theme !== 'light';
  return {
    gain:       dark ? '#34d399' : '#10b981',
    loss:       dark ? '#f87171' : '#ef4444',
    brand:      dark ? '#60a5fa' : '#3b82f6',
    brand2:     dark ? '#c084fc' : '#a855f7',   // comparison colour
    grid:       dark ? '#1e2a38' : '#e2e8f0',
    text:       dark ? '#64748b' : '#94a3b8',
    bg:         dark ? '#0f172a' : '#ffffff',
    tooltip:    dark ? '#1e293b' : '#ffffff',
    tooltipBdr: dark ? '#334155' : '#e2e8f0',
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtN = (n, d = 2) =>
  n == null ? '—' : new Intl.NumberFormat('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }).format(n);

const fmtPct = (n) => n == null ? '—' : `${fmtN(n, 1)}%`;
const today = () => format(new Date(), 'yyyy-MM-dd');

const DATE_PRESETS = [
  { label: 'Today',     key: 'today',   getRange: () => ({ dateFrom: today(), dateTo: today() }) },
  { label: 'This Week', key: 'week',    getRange: () => ({ dateFrom: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'), dateTo: today() }) },
  { label: 'This Month',key: 'month',   getRange: () => ({ dateFrom: format(startOfMonth(new Date()), 'yyyy-MM-dd'), dateTo: today() }) },
  { label: 'This Qtr',  key: 'quarter', getRange: () => ({ dateFrom: format(startOfQuarter(new Date()), 'yyyy-MM-dd'), dateTo: today() }) },
  { label: 'YTD',       key: 'ytd',     getRange: () => ({ dateFrom: format(startOfYear(new Date()), 'yyyy-MM-dd'), dateTo: today() }) },
  { label: 'All Time',  key: 'all',     getRange: () => ({}) },
  { label: 'Custom',    key: 'custom',  getRange: null },
];

const COMPARISON_PRESETS = [
  { label: 'Prev Month', getRange: (cur) => ({
    dateFrom: format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'),
    dateTo:   format(new Date(startOfMonth(new Date()).getTime() - 86400000), 'yyyy-MM-dd'),
  })},
  { label: 'Prev Qtr', getRange: () => ({
    dateFrom: format(startOfQuarter(subQuarters(new Date(), 1)), 'yyyy-MM-dd'),
    dateTo:   format(new Date(startOfQuarter(new Date()).getTime() - 86400000), 'yyyy-MM-dd'),
  })},
];

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const Skeleton = ({ h = 'h-32', className = '' }) => (
  <div className={`skeleton rounded-xl ${h} ${className}`} />
);

// ─── Custom chart tooltip ─────────────────────────────────────────────────────

const ChartTooltip = ({ active, payload, label, colors, prefix = '', suffix = '' }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border px-3 py-2 text-xs shadow-xl"
      style={{ background: colors.tooltip, borderColor: colors.tooltipBdr }}>
      {label && <p className="font-semibold mb-1" style={{ color: colors.text }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {prefix}{fmtN(p.value)}{suffix}
        </p>
      ))}
    </div>
  );
};

// ─── Metric card ──────────────────────────────────────────────────────────────

function MetricCard({ label, value, subValue, compareValue, isLoading, positive, negative, mono = true }) {
  const sign = positive ? 'text-[var(--color-gain-text)]' : negative ? 'text-[var(--color-loss-text)]' : 'text-[var(--color-text-primary)]';
  return (
    <div className="card py-4 px-4">
      <p className="text-xs text-[var(--color-text-muted)] mb-2 uppercase tracking-wide">{label}</p>
      {isLoading
        ? <div className="skeleton h-7 w-24 rounded" />
        : <>
            <p className={`text-xl font-bold ${mono ? 'font-num' : ''} ${sign} leading-tight`}>{value}</p>
            {subValue && <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{subValue}</p>}
            {compareValue != null && (
              <p className="text-xs text-[var(--color-text-muted)] mt-1 border-t border-[var(--color-border)] pt-1">
                vs&nbsp;<span className="text-purple-400 font-num">{compareValue}</span>
              </p>
            )}
          </>}
    </div>
  );
}

// ─── Chart card wrapper ────────────────────────────────────────────────────────

function ChartCard({ title, isLoading, isEmpty, emptyMsg = 'No data available', children, action }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</h2>
        {action}
      </div>
      {isLoading ? <Skeleton h="h-48" /> :
       isEmpty   ? (
         <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--color-border)]">
           <TrendingUp size={24} className="text-[var(--color-text-muted)] opacity-40" />
           <p className="text-sm text-[var(--color-text-muted)]">{emptyMsg}</p>
         </div>
       ) : children}
    </div>
  );
}

// ─── Horizontal breakdown bar ─────────────────────────────────────────────────

function BreakdownBar({ data, colors, isLoading }) {
  if (isLoading) return <Skeleton h="h-48" />;
  if (!data?.length) return (
    <div className="flex h-48 items-center justify-center text-sm text-[var(--color-text-muted)]">No data</div>
  );
  const maxAbs = Math.max(...data.map(d => Math.abs(d.pnl)));
  return (
    <div className="space-y-2 mt-2">
      {data.map((d, i) => {
        const pct = maxAbs > 0 ? (Math.abs(d.pnl) / maxAbs) * 100 : 0;
        const pos = d.pnl >= 0;
        return (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-20 truncate text-right text-[var(--color-text-secondary)] font-medium capitalize">
              {d.label || d.day || '—'}
            </span>
            <div className="flex-1 flex items-center gap-1">
              <div
                className="h-5 rounded transition-all"
                style={{ width: `${pct}%`, background: pos ? colors.gain : colors.loss, minWidth: 2 }}
              />
              <span className={`font-num font-semibold ${pos ? 'text-[var(--color-gain-text)]' : 'text-[var(--color-loss-text)]'}`}>
                {pos ? '+' : ''}{fmtN(d.pnl)}
              </span>
            </div>
            <span className="w-12 text-right text-[var(--color-text-muted)]">{fmtPct(d.winRate)}</span>
            <span className="w-8 text-right text-[var(--color-text-muted)]">{d.tradeCount}</span>
          </div>
        );
      })}
      <div className="flex items-center gap-2 text-[10px] text-[var(--color-text-muted)] border-t border-[var(--color-border)] pt-1 mt-2">
        <span className="w-20" />
        <span className="flex-1">P&L</span>
        <span className="w-12 text-right">Win Rate</span>
        <span className="w-8 text-right">Trades</span>
      </div>
    </div>
  );
}

// ─── Insights ─────────────────────────────────────────────────────────────────

function generateInsights(data) {
  if (!data || data.totalTrades === 0) return [];
  const ins = [];
  const { winRate, averageWin, averageLoss, profitFactor, currentStreak,
    pnlByDayOfWeek, expectancy, maxDrawdown, totalTrades } = data;

  // Win rate
  if (winRate >= 55) ins.push({ type: 'good', text: `Solid win rate of ${fmtPct(winRate)} — you're profitable more often than not.` });
  else if (winRate < 40) ins.push({ type: 'warn', text: `Win rate of ${fmtPct(winRate)} is low. Focus on setup quality over quantity.` });

  // Avg win vs avg loss
  if (averageLoss < 0 && averageWin > 0) {
    const ratio = Math.abs(averageWin / averageLoss);
    if (ratio < 1) ins.push({ type: 'warn', text: `Average loss ($${Math.abs(fmtN(averageLoss))}) exceeds average win ($${fmtN(averageWin)}). Consider tightening stops or extending targets.` });
    else ins.push({ type: 'good', text: `Reward-to-risk ratio of ${fmtN(ratio, 2)}x — your winners outsize your losers.` });
  }

  // Profit factor
  if (profitFactor < 1 && totalTrades >= 5) ins.push({ type: 'bad', text: `Profit factor of ${fmtN(profitFactor, 2)} means you're losing more gross than you're winning. Review your trade selection.` });
  else if (profitFactor >= 2) ins.push({ type: 'good', text: `Excellent profit factor of ${fmtN(profitFactor, 2)} — your gross wins are ${fmtN(profitFactor, 2)}× your gross losses.` });

  // Best day of week
  if (pnlByDayOfWeek?.length) {
    const best = [...pnlByDayOfWeek].sort((a, b) => b.winRate - a.winRate)[0];
    const worst = [...pnlByDayOfWeek].sort((a, b) => a.pnl - b.pnl)[0];
    if (best) ins.push({ type: 'info', text: `${best.day} is your strongest day (${fmtPct(best.winRate)} win rate). ${worst && worst.day !== best.day ? `${worst.day} tends to be weakest.` : ''}` });
  }

  // Current streak
  if (currentStreak <= -3) ins.push({ type: 'warn', text: `You're on a ${Math.abs(currentStreak)}-trade losing streak. Consider reviewing your recent setups or taking a break to reset.` });
  else if (currentStreak >= 5) ins.push({ type: 'good', text: `You're on a ${currentStreak}-trade winning streak — great momentum. Stay disciplined and don't over-size.` });

  // Expectancy
  if (expectancy !== null) {
    if (expectancy < 0) ins.push({ type: 'bad', text: `Negative expectancy (${fmtN(expectancy, 2)}R) means this system loses money on average per trade.` });
    else if (expectancy > 0.5) ins.push({ type: 'good', text: `Expectancy of +${fmtN(expectancy, 2)}R per trade — this is a profitable system.` });
  }

  return ins.slice(0, 5);
}

const INSIGHT_ICON = { good: '✅', warn: '⚠️', bad: '🚨', info: '💡' };

// ─── Main dashboard ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const dispatch  = useDispatch();
  const theme     = useSelector(selectTheme);
  const accounts  = useSelector(selectAccounts);
  const data      = useSelector(selectAnalytics);
  const compData  = useSelector(selectComparison);
  const status    = useSelector(selectAnalyticsStatus);
  const compStatus= useSelector(selectCompStatus);
  const colors    = useChartColors(theme);

  // ── Filter state ────────────────────────────────────────────────────────────
  const [preset, setPreset]         = useState('month');
  const [accountId, setAccountId]   = useState('');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo]     = useState('');
  const [breakdownTab, setBreakdownTab] = useState('symbol');

  // ── Comparison mode ─────────────────────────────────────────────────────────
  const [compareMode, setCompareMode]   = useState(false);
  const [compPreset, setCompPreset]     = useState('');
  const [compFrom, setCompFrom]         = useState('');
  const [compTo, setCompTo]             = useState('');

  // ── Build filter params ─────────────────────────────────────────────────────
  const filterParams = useMemo(() => {
    const p = { accountId: accountId || undefined };
    if (preset === 'custom') {
      if (customFrom) p.dateFrom = customFrom;
      if (customTo)   p.dateTo   = customTo;
    } else {
      const found = DATE_PRESETS.find(x => x.key === preset);
      if (found?.getRange) Object.assign(p, found.getRange());
    }
    return p;
  }, [preset, accountId, customFrom, customTo]);

  const compParams = useMemo(() => {
    if (!compareMode) return null;
    if (compPreset) {
      const found = COMPARISON_PRESETS.find(x => x.label === compPreset);
      if (found) return { ...found.getRange(), accountId: accountId || undefined };
    }
    if (compFrom || compTo) return { dateFrom: compFrom, dateTo: compTo, accountId: accountId || undefined };
    return null;
  }, [compareMode, compPreset, compFrom, compTo, accountId]);

  // ── Fetch on filter change ──────────────────────────────────────────────────
  useEffect(() => {
    dispatch(fetchAnalytics(filterParams));
  }, [dispatch, JSON.stringify(filterParams)]);

  useEffect(() => {
    if (accounts.length === 0) dispatch(fetchAccounts());
  }, []);

  useEffect(() => {
    if (compParams) dispatch(fetchComparisonAnalytics(compParams));
    else dispatch(clearComparison());
  }, [dispatch, JSON.stringify(compParams)]);

  const isLoading   = status === 'loading';
  const noTrades    = !isLoading && (!data || data.totalTrades === 0);
  const insights    = useMemo(() => generateInsights(data), [data]);

  // Overlay equity curves for comparison
  const equityData = useMemo(() => {
    if (!data?.equityCurve?.length) return [];
    if (!compData?.equityCurve?.length) return data.equityCurve;
    const compMap = Object.fromEntries(compData.equityCurve.map(d => [d.date, d.cumulativePnl]));
    return data.equityCurve.map(d => ({ ...d, compPnl: compMap[d.date] }));
  }, [data, compData]);

  const breakdownData = useMemo(() => {
    if (!data) return [];
    const map = { symbol: data.pnlBySymbol, tag: data.pnlByTag, asset: data.pnlByAssetClass, dow: data.pnlByDayOfWeek };
    const raw = map[breakdownTab] || [];
    return (breakdownTab === 'dow' ? raw : raw).slice(0, 10);
  }, [data, breakdownTab]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* ── Page title ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Dashboard</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Your trading performance at a glance</p>
        </div>
        {/* Compare toggle */}
        <button
          onClick={() => setCompareMode(m => !m)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors
            ${compareMode
              ? 'border-purple-500 bg-purple-500/10 text-purple-400'
              : 'border-[var(--color-border)] bg-[var(--color-surface-100)] text-[var(--color-text-secondary)] hover:border-[var(--color-brand)]'}`}
        >
          <GitCompare size={14} /> Compare Period
        </button>
      </div>

      {/* ── Filter bar ── */}
      <div className="card py-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Date presets */}
          <div className="flex gap-1 flex-wrap">
            {DATE_PRESETS.map(p => (
              <button
                key={p.key}
                onClick={() => setPreset(p.key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors
                  ${preset === p.key
                    ? 'bg-[var(--color-brand)] text-white'
                    : 'bg-[var(--color-surface-100)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-brand)]'}`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom date range */}
          {preset === 'custom' && (
            <div className="flex items-center gap-1">
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-100)] px-2 py-1 text-xs focus:outline-none focus:border-[var(--color-brand)]" />
              <span className="text-xs text-[var(--color-text-muted)]">to</span>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-100)] px-2 py-1 text-xs focus:outline-none focus:border-[var(--color-brand)]" />
            </div>
          )}

          {/* Account filter */}
          {accounts.length > 1 && (
            <select
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-100)] px-2 py-1.5 text-xs text-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-brand)]"
            >
              <option value="">All Accounts</option>
              {accounts.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
            </select>
          )}
        </div>

        {/* Comparison period selector */}
        {compareMode && (
          <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex flex-wrap items-center gap-2">
            <span className="text-xs text-purple-400 font-medium">Compare to:</span>
            {COMPARISON_PRESETS.map(p => (
              <button key={p.label}
                onClick={() => { setCompPreset(p.label); setCompFrom(''); setCompTo(''); }}
                className={`rounded-lg px-3 py-1 text-xs font-medium border transition-colors
                  ${compPreset === p.label
                    ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                    : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-purple-400'}`}
              >
                {p.label}
              </button>
            ))}
            <span className="text-xs text-[var(--color-text-muted)]">or custom:</span>
            <input type="date" value={compFrom} onChange={e => { setCompFrom(e.target.value); setCompPreset(''); }}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-100)] px-2 py-1 text-xs focus:outline-none" />
            <span className="text-xs text-[var(--color-text-muted)]">to</span>
            <input type="date" value={compTo} onChange={e => { setCompTo(e.target.value); setCompPreset(''); }}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-100)] px-2 py-1 text-xs focus:outline-none" />
          </div>
        )}
      </div>

      {/* ── Empty state ── */}
      {noTrades && (
        <div className="card flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="rounded-full bg-[var(--color-brand-subtle)] p-5">
            <TrendingUp size={32} className="text-[var(--color-brand)]" />
          </div>
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">No trades in this period</h2>
          <p className="text-sm text-[var(--color-text-muted)] max-w-sm">
            Log your first trade or adjust the date range to see your performance analytics.
          </p>
        </div>
      )}

      {/* ── Metric cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          {
            label: 'Net P&L',
            value: data ? (data.netPnl >= 0 ? '+' : '') + fmtN(data.netPnl) : '—',
            compareValue: compData ? (compData.netPnl >= 0 ? '+' : '') + fmtN(compData.netPnl) : undefined,
            positive: data?.netPnl > 0, negative: data?.netPnl < 0,
          },
          {
            label: 'Win Rate',
            value: data ? fmtPct(data.winRate) : '—',
            compareValue: compData ? fmtPct(compData.winRate) : undefined,
            positive: data?.winRate >= 50, negative: data?.winRate < 40,
            mono: false,
          },
          {
            label: 'Profit Factor',
            value: data ? fmtN(data.profitFactor) : '—',
            compareValue: compData ? fmtN(compData.profitFactor) : undefined,
            positive: data?.profitFactor >= 1.5, negative: data?.profitFactor < 1,
          },
          {
            label: 'Expectancy',
            value: data?.expectancy != null ? `${data.expectancy >= 0 ? '+' : ''}${fmtN(data.expectancy, 2)}R` : '—',
            compareValue: compData?.expectancy != null ? `${fmtN(compData.expectancy, 2)}R` : undefined,
            positive: data?.expectancy > 0, negative: data?.expectancy < 0,
          },
          {
            label: 'Avg Win / Loss',
            value: data ? `${fmtN(data.averageWin)} / ${fmtN(data.averageLoss)}` : '—',
            positive: false, negative: false,
          },
          {
            label: 'Total Trades',
            value: data ? String(data.totalTrades) : '—',
            subValue: data ? `${data.winCount}W / ${data.lossCount}L` : undefined,
          },
          {
            label: 'Streak',
            value: data
              ? data.currentStreak > 0 ? `+${data.currentStreak}W` : `${Math.abs(data.currentStreak)}L`
              : '—',
            compareValue: compData
              ? compData.currentStreak > 0 ? `+${compData.currentStreak}W` : `${Math.abs(compData.currentStreak)}L`
              : undefined,
            positive: data?.currentStreak > 0, negative: data?.currentStreak < 0,
          },
          {
            label: 'Max Drawdown',
            value: data ? `-${fmtN(data.maxDrawdown)}` : '—',
            compareValue: compData ? `-${fmtN(compData.maxDrawdown)}` : undefined,
            negative: true,
          },
        ].map((card, i) => (
          <MetricCard key={i} {...card} isLoading={isLoading} />
        ))}
      </div>

      {/* ── Equity curve + P&L by period ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Equity curve */}
        <div className="lg:col-span-2">
          <ChartCard
            title="Equity Curve"
            isLoading={isLoading}
            isEmpty={!equityData.length}
            emptyMsg="Log closed trades to see your equity curve"
          >
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={equityData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gainGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.gain} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={colors.gain} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.brand2} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={colors.brand2} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: colors.text }} tickLine={false} axisLine={false} minTickGap={40} />
                <YAxis tick={{ fontSize: 10, fill: colors.text }} tickLine={false} axisLine={false} tickFormatter={v => fmtN(v, 0)} width={55} />
                <ReferenceLine y={0} stroke={colors.text} strokeDasharray="4 2" opacity={0.5} />
                <Tooltip content={<ChartTooltip colors={colors} />} />
                <Area type="monotone" dataKey="cumulativePnl" name="Equity" stroke={colors.gain} fill="url(#gainGrad)" strokeWidth={2} dot={false} />
                {compareMode && compData && (
                  <Area type="monotone" dataKey="compPnl" name="Comparison" stroke={colors.brand2} fill="url(#compGrad)" strokeWidth={2} dot={false} strokeDasharray="5 3" />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* P&L by period */}
        <div>
          <ChartCard
            title={`P&L by ${data?.granularity === 'month' ? 'Month' : data?.granularity === 'week' ? 'Week' : 'Day'}`}
            isLoading={isLoading}
            isEmpty={!data?.pnlByPeriod?.length}
            emptyMsg="No period data"
          >
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data?.pnlByPeriod || []} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
                <XAxis dataKey="period" tick={{ fontSize: 9, fill: colors.text }} tickLine={false} axisLine={false} minTickGap={20} />
                <YAxis tick={{ fontSize: 10, fill: colors.text }} tickLine={false} axisLine={false} tickFormatter={v => fmtN(v, 0)} width={50} />
                <ReferenceLine y={0} stroke={colors.text} opacity={0.3} />
                <Tooltip content={<ChartTooltip colors={colors} />} />
                <Bar dataKey="pnl" name="P&L" radius={[3, 3, 0, 0]}>
                  {(data?.pnlByPeriod || []).map((entry, i) => (
                    <Cell key={i} fill={entry.pnl >= 0 ? colors.gain : colors.loss} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      {/* ── Breakdown row ── */}
      <div className="card">
        {/* Tabs */}
        <div className="flex items-center gap-1 mb-4 border-b border-[var(--color-border)] pb-3">
          {[
            { key: 'symbol', label: 'By Symbol' },
            { key: 'asset',  label: 'By Asset Class' },
            { key: 'tag',    label: 'By Tag' },
            { key: 'dow',    label: 'By Day of Week' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setBreakdownTab(tab.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors
                ${breakdownTab === tab.key
                  ? 'bg-[var(--color-brand-subtle)] text-[var(--color-brand)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <BreakdownBar data={breakdownData} colors={colors} isLoading={isLoading} />
      </div>

      {/* ── Bottom row: R-distribution + Drawdown + Scatter ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* R-Multiple distribution */}
        <ChartCard
          title="R-Multiple Distribution"
          isLoading={isLoading}
          isEmpty={!data?.rMultipleDistribution?.some(b => b.count > 0)}
          emptyMsg="Set stop losses on trades to see R-distribution"
        >
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data?.rMultipleDistribution || []} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
              <XAxis dataKey="bucket" tick={{ fontSize: 9, fill: colors.text }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: colors.text }} tickLine={false} axisLine={false} allowDecimals={false} width={30} />
              <Tooltip
                content={({ active, payload, label }) => active && payload?.length
                  ? <div className="rounded-lg border px-3 py-2 text-xs shadow-xl" style={{ background: colors.tooltip, borderColor: colors.tooltipBdr }}>
                      <p style={{ color: colors.text }}>{label}</p>
                      <p style={{ color: payload[0]?.fill }}>Trades: {payload[0]?.value}</p>
                    </div>
                  : null}
              />
              <Bar dataKey="count" name="Trades" radius={[3, 3, 0, 0]}>
                {(data?.rMultipleDistribution || []).map((entry, i) => (
                  <Cell key={i} fill={entry.bucket.startsWith('<') || entry.bucket.startsWith('-') ? colors.loss : colors.gain} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Drawdown chart */}
        <ChartCard
          title="Drawdown (Underwater)"
          isLoading={isLoading}
          isEmpty={!data?.drawdownCurve?.length}
          emptyMsg="No drawdown data yet"
        >
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={data?.drawdownCurve || []} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.loss} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={colors.loss} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: colors.text }} tickLine={false} axisLine={false} minTickGap={40} />
              <YAxis tick={{ fontSize: 10, fill: colors.text }} tickLine={false} axisLine={false} tickFormatter={v => fmtN(v, 0)} width={50} />
              <ReferenceLine y={0} stroke={colors.text} opacity={0.3} />
              <Tooltip content={<ChartTooltip colors={colors} />} />
              <Area type="monotone" dataKey="drawdown" name="Drawdown" stroke={colors.loss} fill="url(#ddGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Duration vs P&L scatter */}
        <ChartCard
          title="Trade Duration vs P&L"
          isLoading={isLoading}
          isEmpty={!data?.durationVsPnl?.length || data.durationVsPnl.length < 3}
          emptyMsg="Need more closed trades with exit times"
        >
          <ResponsiveContainer width="100%" height={180}>
            <ScatterChart margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis type="number" dataKey="durationMinutes" name="Duration (min)" tick={{ fontSize: 9, fill: colors.text }} tickLine={false} axisLine={false} unit="m" />
              <YAxis type="number" dataKey="pnl" name="P&L" tick={{ fontSize: 10, fill: colors.text }} tickLine={false} axisLine={false} tickFormatter={v => fmtN(v, 0)} width={50} />
              <ReferenceLine y={0} stroke={colors.text} opacity={0.3} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => active && payload?.length
                  ? <div className="rounded-lg border px-3 py-2 text-xs shadow-xl" style={{ background: colors.tooltip, borderColor: colors.tooltipBdr }}>
                      <p style={{ color: colors.text }}>{Math.round(payload[0]?.value)}m duration</p>
                      <p style={{ color: payload[1]?.value >= 0 ? colors.gain : colors.loss }}>P&L: {fmtN(payload[1]?.value)}</p>
                    </div>
                  : null}
              />
              <Scatter
                data={data?.durationVsPnl || []}
                fill={colors.brand}
              >
                {(data?.durationVsPnl || []).map((entry, i) => (
                  <Cell key={i} fill={entry.pnl >= 0 ? colors.gain : colors.loss} fillOpacity={0.7} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Insights panel ── */}
      {!isLoading && insights.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} className="text-[var(--color-warning)]" />
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Insights</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {insights.map((ins, i) => (
              <div key={i} className={`rounded-xl border p-3 text-sm
                ${ins.type === 'good' ? 'border-[var(--color-gain)]/30 bg-[var(--color-gain-subtle)]'
                  : ins.type === 'bad' ? 'border-[var(--color-loss)]/30 bg-[var(--color-loss-subtle)]'
                  : ins.type === 'warn' ? 'border-[var(--color-warning)]/30 bg-[var(--color-warning-subtle)]'
                  : 'border-[var(--color-border)] bg-[var(--color-surface-100)]'}`}
              >
                <span className="mr-1">{INSIGHT_ICON[ins.type]}</span>
                <span className="text-[var(--color-text-secondary)]">{ins.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
