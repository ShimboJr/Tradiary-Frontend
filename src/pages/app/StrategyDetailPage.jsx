/**
 * pages/app/StrategyDetailPage.jsx
 * Strategy rules, example screenshots, performance summary from analytics,
 * recent trades list, discipline score overview.
 */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { format } from 'date-fns';
import { ArrowLeft, Edit2, CheckCircle, Circle, TrendingUp, TrendingDown } from 'lucide-react';
import {
  fetchStrategy, fetchStrategyTrades, selectStrategy,
  selectStrategyTrades, selectStrategyDetailStatus,
} from '@/features/strategies/strategiesSlice';
import { apiGetAnalyticsSummary } from '@/api/analytics';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import Badge from '@/components/ui/Badge';
import Lightbox from '@/components/ui/Lightbox';

const fmtN = (n, d = 2) => n == null ? '—' : n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

export default function StrategyDetailPage() {
  const { id }    = useParams();
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const strategy  = useSelector(selectStrategy);
  const trades    = useSelector(selectStrategyTrades);
  const status    = useSelector(selectStrategyDetailStatus);

  const [analytics, setAnalytics]       = useState(null);
  const [lightboxIdx, setLightboxIdx]   = useState(null);

  useEffect(() => {
    dispatch(fetchStrategy(id));
    dispatch(fetchStrategyTrades(id));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    apiGetAnalyticsSummary({ strategyId: id })
      .then(r => setAnalytics(r.data.data))
      .catch(() => {});
  }, [id]);

  // avg discipline score
  const avgDiscipline = trades.length
    ? trades.filter(t => t.disciplineScore != null).reduce((s, t) => s + t.disciplineScore, 0)
      / (trades.filter(t => t.disciplineScore != null).length || 1)
    : null;

  if (status === 'loading' || !strategy || strategy._id !== id) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/app/playbooks" className="rounded-lg p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-200)] transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full" style={{ background: strategy.color }} />
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{strategy.name}</h1>
          </div>
        </div>
        <button
          onClick={() => navigate('/app/playbooks', { state: { editId: id } })}
          className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:border-[var(--color-brand)] transition-colors"
        >
          <Edit2 size={14} /> Edit
        </button>
      </div>

      {strategy.description && (
        <p className="text-sm text-[var(--color-text-muted)]">{strategy.description}</p>
      )}

      {/* Performance summary */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Net P&L', value: analytics.netPnl != null ? `${analytics.netPnl >= 0 ? '+' : ''}${fmtN(analytics.netPnl)}` : '—', cls: analytics.netPnl >= 0 ? 'text-[var(--color-gain-text)]' : 'text-[var(--color-loss-text)]' },
            { label: 'Win Rate', value: `${fmtN(analytics.winRate, 1)}%`, cls: analytics.winRate >= 50 ? 'text-[var(--color-gain-text)]' : 'text-[var(--color-loss-text)]' },
            { label: 'Expectancy', value: analytics.expectancy != null ? `${analytics.expectancy >= 0 ? '+' : ''}${fmtN(analytics.expectancy, 2)}R` : '—', cls: analytics.expectancy > 0 ? 'text-[var(--color-gain-text)]' : 'text-[var(--color-loss-text)]' },
            { label: 'Trades', value: String(analytics.totalTrades), cls: 'text-[var(--color-text-primary)]' },
            { label: 'Avg Discipline', value: avgDiscipline != null ? `${avgDiscipline.toFixed(0)}%` : '—', cls: avgDiscipline >= 80 ? 'text-[var(--color-gain-text)]' : avgDiscipline >= 50 ? 'text-[var(--color-warning)]' : 'text-[var(--color-loss-text)]' },
          ].map(({ label, value, cls }) => (
            <div key={label} className="card py-3 px-4 text-center">
              <p className="text-xs text-[var(--color-text-muted)] mb-1">{label}</p>
              <p className={`text-lg font-bold font-num ${cls}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Mini equity curve */}
      {analytics?.equityCurve?.length > 1 && (
        <div className="card">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Equity Curve</h2>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={analytics.equityCurve} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="sGain" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={strategy.color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={strategy.color} stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a38" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={false} minTickGap={40} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} tickFormatter={v => fmtN(v, 0)} width={50} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="cumulativePnl" name="P&L" stroke={strategy.color} fill="url(#sGain)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Rules checklist */}
        <div className="card">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
            Entry Rules ({strategy.rules.length})
          </h2>
          {strategy.rules.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)] italic">No rules defined for this strategy.</p>
          ) : (
            <div className="space-y-2">
              {strategy.rules.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((r, i) => (
                <div key={r._id || i} className="flex items-start gap-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-100)] px-3 py-2.5">
                  <span className="text-xs font-bold text-[var(--color-text-muted)] w-4 shrink-0 mt-0.5">{i + 1}.</span>
                  <span className="text-sm text-[var(--color-text-secondary)]">{r.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent trades */}
        <div className="card">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Recent Trades</h2>
          {trades.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)] italic">No trades logged with this strategy yet.</p>
          ) : (
            <div className="space-y-2">
              {trades.slice(0, 8).map(t => (
                <Link key={t._id} to={`/app/trades/${t._id}`}
                  className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-100)] px-3 py-2 hover:border-[var(--color-brand)] transition-colors">
                  <div className="flex items-center gap-2">
                    <Badge variant={t.direction}>{t.direction}</Badge>
                    <span className="text-sm font-semibold text-[var(--color-text-primary)]">{t.symbol}</span>
                    <span className="text-xs text-[var(--color-text-muted)] font-num">
                      {format(new Date(t.entryDate), 'MMM d')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {t.disciplineScore != null && (
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full
                        ${t.disciplineScore >= 80 ? 'bg-[var(--color-gain-subtle)] text-[var(--color-gain-text)]'
                          : t.disciplineScore >= 50 ? 'bg-[var(--color-warning-subtle)] text-[var(--color-warning)]'
                          : 'bg-[var(--color-loss-subtle)] text-[var(--color-loss-text)]'}`}>
                        {t.disciplineScore.toFixed(0)}% disc.
                      </span>
                    )}
                    <span className={`text-sm font-bold font-num ${(t.pnl || 0) >= 0 ? 'text-[var(--color-gain-text)]' : 'text-[var(--color-loss-text)]'}`}>
                      {t.pnl != null ? `${t.pnl >= 0 ? '+' : ''}${fmtN(t.pnl)}` : '—'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Example screenshots */}
      {strategy.exampleScreenshots?.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Example Setups</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {strategy.exampleScreenshots.map((url, i) => (
              <div key={i} className="relative group rounded-lg overflow-hidden border border-[var(--color-border)] cursor-pointer"
                onClick={() => setLightboxIdx(i)}>
                <img src={url} alt={`Example ${i+1}`} className="w-full h-40 object-cover transition-transform group-hover:scale-105" />
              </div>
            ))}
          </div>
        </div>
      )}

      {lightboxIdx !== null && (
        <Lightbox
          images={strategy.exampleScreenshots.map(url => ({ url }))}
          index={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onNavigate={setLightboxIdx}
        />
      )}
    </div>
  );
}
