/**
 * pages/app/MistakesPage.jsx
 * Mistake frequency bar chart + cost table, drawn from /api/analytics/mistakes.
 */
import React, { useEffect, useState } from 'react';
import { AlertOctagon } from 'lucide-react';
import { apiGetMistakes } from '@/api/strategies';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { format, startOfMonth, startOfYear } from 'date-fns';

const PRESETS = [
  { label: 'This Month', dateFrom: format(startOfMonth(new Date()), 'yyyy-MM-dd') },
  { label: 'YTD',        dateFrom: format(startOfYear(new Date()), 'yyyy-MM-dd') },
  { label: 'All Time',   dateFrom: undefined },
];

const fmtN = (n) => n == null ? '—' : new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2, signDisplay: 'exceptZero' }).format(n);

export default function MistakesPage() {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(false);
  const [preset,  setPreset]  = useState('This Month');

  const load = async (dateFrom) => {
    setLoading(true);
    try {
      const res = await apiGetMistakes(dateFrom ? { dateFrom } : {});
      setData(res.data.data || []);
    } catch { setData([]); }
    finally { setLoading(false); }
  };

  const currentPreset = PRESETS.find(p => p.label === preset);

  useEffect(() => { load(currentPreset?.dateFrom); }, [preset]);

  const maxCount = data.length ? Math.max(...data.map(d => d.count)) : 0;
  const totalCost = data.reduce((s, d) => s + (d.pnl || 0), 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Mistake Tracker</h1>
        <p className="text-sm text-[var(--color-text-muted)]">Identify recurring errors and understand their P&L cost</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {PRESETS.map(p => (
          <button key={p.label} onClick={() => setPreset(p.label)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors
              ${preset === p.label ? 'bg-[var(--color-brand)] text-white' : 'border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-brand)]'}`}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      {data.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="card py-3 px-4 text-center">
            <p className="text-xs text-[var(--color-text-muted)] mb-1">Mistake Types</p>
            <p className="text-xl font-bold text-[var(--color-text-primary)]">{data.length}</p>
          </div>
          <div className="card py-3 px-4 text-center">
            <p className="text-xs text-[var(--color-text-muted)] mb-1">Total Occurrences</p>
            <p className="text-xl font-bold text-[var(--color-text-primary)]">{data.reduce((s, d) => s + d.count, 0)}</p>
          </div>
          <div className="card py-3 px-4 text-center">
            <p className="text-xs text-[var(--color-text-muted)] mb-1">Total P&L Cost</p>
            <p className={`text-xl font-bold font-num ${totalCost >= 0 ? 'text-[var(--color-gain-text)]' : 'text-[var(--color-loss-text)]'}`}>
              {fmtN(totalCost)}
            </p>
          </div>
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
        </div>
      )}

      {!loading && data.length === 0 && (
        <div className="card flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="rounded-full bg-[var(--color-gain-subtle)] p-5">
            <AlertOctagon size={32} className="text-[var(--color-gain-text)]" />
          </div>
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">No mistakes logged</h2>
          <p className="text-sm text-[var(--color-text-muted)] max-w-sm">
            When logging trades, select any mistakes made (FOMO entry, no stop loss, etc.) and they'll appear here with their P&L cost.
          </p>
        </div>
      )}

      {!loading && data.length > 0 && (
        <>
          {/* Frequency bar chart */}
          <div className="card">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Frequency</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data} layout="vertical" margin={{ top: 4, right: 60, left: 10, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2a38" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="mistake" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={140} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                  formatter={(v) => [v, 'Occurrences']}
                />
                <Bar dataKey="count" name="Count" radius={[0, 4, 4, 0]}>
                  {data.map((_, i) => (
                    <Cell key={i} fill={`hsla(4, 82%, ${55 + i * 3}%, ${1 - (i * 0.06)})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* P&L cost table */}
          <div className="card">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">P&L Cost per Mistake</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    {['Mistake', 'Occurrences', 'Win Rate', 'P&L Cost'].map(h => (
                      <th key={h} className="pb-2 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((d, i) => (
                    <tr key={i} className="border-b border-[var(--color-border)] last:border-0">
                      <td className="py-2.5 font-medium text-[var(--color-text-primary)]">{d.mistake}</td>
                      <td className="py-2.5 font-num text-[var(--color-text-secondary)]">{d.count}</td>
                      <td className="py-2.5 font-num text-[var(--color-text-secondary)]">
                        {d.winRate != null ? `${d.winRate.toFixed(1)}%` : '—'}
                      </td>
                      <td className={`py-2.5 font-num font-semibold ${(d.pnl || 0) >= 0 ? 'text-[var(--color-gain-text)]' : 'text-[var(--color-loss-text)]'}`}>
                        {fmtN(d.pnl)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
