/**
 * pages/app/CalendarPage.jsx
 * Month grid with P&L heat map, day-click side panel, week totals.
 */
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, X, TrendingUp, TrendingDown } from 'lucide-react';
import { fetchAccounts, selectAccounts } from '@/features/accounts/accountsSlice';
import { apiCalendarData } from '@/api/trades';
import Badge from '@/components/ui/Badge';

const fmt = (n) => n == null ? '—'
  : new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2, signDisplay: 'exceptZero' }).format(n);

// ─── P&L intensity → background color ────────────────────────────────────────

function pnlBg(pnl, maxAbs) {
  if (pnl == null || maxAbs === 0) return 'transparent';
  const intensity = Math.min(Math.abs(pnl) / maxAbs, 1);
  const alpha = 0.15 + intensity * 0.45;
  return pnl >= 0
    ? `hsla(152, 70%, 48%, ${alpha})`
    : `hsla(4, 82%, 55%, ${alpha})`;
}

function pnlText(pnl) {
  if (pnl == null) return 'text-[var(--color-text-muted)]';
  return pnl > 0 ? 'text-[var(--color-gain-text)]' : pnl < 0 ? 'text-[var(--color-loss-text)]' : 'text-[var(--color-text-muted)]';
}

export default function CalendarPage() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const accounts  = useSelector(selectAccounts);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calData, setCalData]           = useState({});   // { 'YYYY-MM-DD': { pnl, count, trades } }
  const [loading, setLoading]           = useState(false);
  const [selectedDay, setSelectedDay]   = useState(null);
  const [accountId, setAccountId]       = useState('');

  useEffect(() => { if (accounts.length === 0) dispatch(fetchAccounts()); }, []);

  useEffect(() => {
    setLoading(true);
    apiCalendarData({
      year:  currentMonth.getFullYear(),
      month: currentMonth.getMonth() + 1,
      ...(accountId ? { accountId } : {}),
    })
      .then(res => setCalData(res.data.data))
      .catch(() => setCalData({}))
      .finally(() => setLoading(false));
  }, [currentMonth, accountId]);

  // Build calendar grid (6 weeks, Mon-start)
  const monthStart = startOfMonth(currentMonth);
  const monthEnd   = endOfMonth(currentMonth);
  const gridStart  = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd    = endOfWeek(monthEnd,   { weekStartsOn: 1 });

  const days = [];
  let day = gridStart;
  while (day <= gridEnd) { days.push(day); day = addDays(day, 1); }
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  const allPnls = Object.values(calData).map(d => Math.abs(d.pnl));
  const maxAbs  = allPnls.length ? Math.max(...allPnls) : 0;

  // Month totals
  const monthPnl    = Object.values(calData).reduce((sum, d) => sum + (d.pnl || 0), 0);
  const monthTrades = Object.values(calData).reduce((sum, d) => sum + d.count, 0);
  const winDays     = Object.values(calData).filter(d => d.pnl > 0).length;
  const lossDays    = Object.values(calData).filter(d => d.pnl < 0).length;

  const selectedData = selectedDay ? calData[format(selectedDay, 'yyyy-MM-dd')] : null;

  return (
    <div className="flex gap-6">
      {/* ── Main calendar ── */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
              {format(currentMonth, 'MMMM yyyy')}
            </h1>
            <p className="text-sm text-[var(--color-text-muted)]">
              {monthTrades} trades · Net P&L:&nbsp;
              <span className={`font-semibold font-num ${pnlText(monthPnl)}`}>{fmt(monthPnl)}</span>
              &nbsp;· {winDays}W / {lossDays}L days
            </p>
          </div>
          <div className="flex items-center gap-3">
            {accounts.length > 1 && (
              <select
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-100)] px-2 py-1.5 text-sm focus:outline-none focus:border-[var(--color-brand)]"
                value={accountId}
                onChange={e => setAccountId(e.target.value)}
              >
                <option value="">All Accounts</option>
                {accounts.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
              </select>
            )}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentMonth(m => subMonths(m, 1))}
                className="rounded-lg p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-200)] transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setCurrentMonth(new Date())}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-200)] transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => setCurrentMonth(m => addMonths(m, 1))}
                className="rounded-lg p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-200)] transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="card p-0 overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-8 border-b border-[var(--color-border)]">
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
              <div key={d} className="px-2 py-2 text-center text-xs font-semibold text-[var(--color-text-muted)] uppercase">
                {d}
              </div>
            ))}
            <div className="px-2 py-2 text-center text-xs font-semibold text-[var(--color-text-muted)] uppercase">Week</div>
          </div>

          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-brand)] border-t-transparent" />
            </div>
          )}

          {!loading && weeks.map((week, wi) => {
            const weekPnl = week.reduce((sum, d) => {
              const key = format(d, 'yyyy-MM-dd');
              return sum + (calData[key]?.pnl || 0);
            }, 0);
            return (
              <div key={wi} className="grid grid-cols-8 border-b border-[var(--color-border)] last:border-0">
                {week.map((d) => {
                  const key   = format(d, 'yyyy-MM-dd');
                  const data  = calData[key];
                  const inMonth = isSameMonth(d, currentMonth);
                  const today   = isToday(d);
                  const isSelected = selectedDay && format(selectedDay, 'yyyy-MM-dd') === key;

                  return (
                    <div
                      key={key}
                      onClick={() => { if (inMonth) setSelectedDay(isSelected ? null : d); }}
                      className={`relative min-h-[80px] p-2 border-r border-[var(--color-border)] transition-colors
                        ${inMonth ? 'cursor-pointer hover:brightness-110' : 'opacity-30'}
                        ${isSelected ? 'ring-2 ring-inset ring-[var(--color-brand)]' : ''}`}
                      style={{ background: inMonth && data ? pnlBg(data.pnl, maxAbs) : undefined }}
                    >
                      <span className={`text-xs font-semibold ${today ? 'rounded-full bg-[var(--color-brand)] text-white px-1.5 py-0.5' : 'text-[var(--color-text-muted)]'}`}>
                        {format(d, 'd')}
                      </span>
                      {inMonth && data && (
                        <div className="mt-1 space-y-0.5">
                          <p className={`text-xs font-bold font-num leading-tight ${pnlText(data.pnl)}`}>
                            {fmt(data.pnl)}
                          </p>
                          <p className="text-[10px] text-[var(--color-text-muted)]">
                            {data.count} trade{data.count !== 1 ? 's' : ''}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
                {/* Week total */}
                <div className="flex flex-col items-center justify-center p-2 bg-[var(--color-surface-100)]">
                  <p className="text-[10px] text-[var(--color-text-muted)] mb-0.5">Total</p>
                  <p className={`text-xs font-bold font-num ${pnlText(weekPnl)}`}>
                    {weekPnl !== 0 ? fmt(weekPnl) : '—'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-6 rounded" style={{ background: 'hsla(152,70%,48%,0.5)' }} />
            Profitable day
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-6 rounded" style={{ background: 'hsla(4,82%,55%,0.5)' }} />
            Loss day
          </div>
          <span>Deeper color = larger absolute P&L</span>
        </div>
      </div>

      {/* ── Day side panel ── */}
      {selectedDay && selectedData && (
        <div className="w-72 flex-shrink-0 space-y-3">
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {format(selectedDay, 'EEEE, MMM d')}
                </p>
                <p className={`text-lg font-bold font-num ${pnlText(selectedData.pnl)}`}>
                  {fmt(selectedData.pnl)}
                </p>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="rounded-lg p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-200)] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2">
              {selectedData.trades.map(t => (
                <button
                  key={t.id}
                  onClick={() => navigate(`/app/trades/${t.id}`)}
                  className="w-full flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-100)] px-3 py-2 hover:border-[var(--color-brand)] transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    {t.direction === 'long'
                      ? <TrendingUp size={14} className="text-[var(--color-gain-text)]" />
                      : <TrendingDown size={14} className="text-[var(--color-loss-text)]" />}
                    <span className="text-sm font-semibold text-[var(--color-text-primary)]">{t.symbol}</span>
                  </div>
                  <span className={`text-sm font-bold font-num ${pnlText(t.pnl)}`}>
                    {fmt(t.pnl)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
