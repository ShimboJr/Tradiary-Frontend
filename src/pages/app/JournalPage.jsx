/**
 * pages/app/JournalPage.jsx
 * Daily journal: date picker, mood selector, free-form notes, mood-vs-P&L chart.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { format, subDays } from 'date-fns';
import { Save, BookOpen, Smile, TrendingUp } from 'lucide-react';
import { apiGetJournalDate, apiUpsertJournal, apiMoodChart } from '@/api/journal';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts';

const MOODS = [
  { value: 1, emoji: '😔', label: 'Poor' },
  { value: 2, emoji: '😕', label: 'Below avg' },
  { value: 3, emoji: '😐', label: 'Neutral' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😄', label: 'Great' },
];

const today = () => format(new Date(), 'yyyy-MM-dd');

export default function JournalPage() {
  const [selectedDate, setSelectedDate] = useState(today());
  const [mood, setMood]                 = useState(null);
  const [marketNotes, setMarketNotes]   = useState('');
  const [lessons, setLessons]           = useState('');
  const [saving, setSaving]             = useState(false);
  const [saved, setSaved]               = useState(false);
  const [moodChart, setMoodChart]       = useState([]);
  const [loading, setLoading]           = useState(false);

  // Load entry for selected date
  const loadEntry = useCallback(async (date) => {
    setLoading(true);
    try {
      const res = await apiGetJournalDate(date);
      const entry = res.data.data;
      setMood(entry?.mood ?? null);
      setMarketNotes(entry?.marketNotes ?? '');
      setLessons(entry?.lessonsLearned ?? '');
    } catch { setMood(null); setMarketNotes(''); setLessons(''); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadEntry(selectedDate); setSaved(false); }, [selectedDate]);

  // Load mood chart (last 90 days)
  useEffect(() => {
    const dateFrom = format(subDays(new Date(), 89), 'yyyy-MM-dd');
    apiMoodChart({ dateFrom, dateTo: today() })
      .then(r => setMoodChart(r.data.data || []))
      .catch(() => {});
  }, [saved]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiUpsertJournal(selectedDate, { mood, marketNotes, lessonsLearned: lessons });
      setSaved(true);
    } catch { } finally { setSaving(false); }
  };

  // Normalise P&L for overlay (scale to 0-5 range)
  const chartData = moodChart.map(d => {
    const pnls = moodChart.filter(x => x.pnl != null).map(x => x.pnl);
    const min  = pnls.length ? Math.min(...pnls) : -1;
    const max  = pnls.length ? Math.max(...pnls) : 1;
    const range = max - min || 1;
    const normalizedPnl = d.pnl != null ? 1 + ((d.pnl - min) / range) * 4 : null;
    return { date: d.date, mood: d.mood, normalizedPnl, rawPnl: d.pnl };
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Daily Journal</h1>
        <p className="text-sm text-[var(--color-text-muted)]">Free-form trading reflection — separate from individual trade notes</p>
      </div>

      {/* Date selector */}
      <div className="flex items-center gap-3">
        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} max={today()}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-100)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-brand)]" />
        {[0, 1, 2, 3, 4, 5, 6].map(d => {
          const date = format(subDays(new Date(), d), 'yyyy-MM-dd');
          const label = d === 0 ? 'Today' : d === 1 ? 'Yesterday' : format(subDays(new Date(), d), 'EEE');
          return (
            <button key={d} onClick={() => setSelectedDate(date)}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${selectedDate === date ? 'bg-[var(--color-brand)] text-white' : 'border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-brand)]'}`}>
              {label}
            </button>
          );
        })}
      </div>

      <div className="card space-y-5">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-12 rounded-lg" />)}
          </div>
        ) : (
          <>
            {/* Mood */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-2">
                How are you feeling today?
              </label>
              <div className="flex gap-2">
                {MOODS.map(m => (
                  <button key={m.value} onClick={() => setMood(mood === m.value ? null : m.value)}
                    title={m.label}
                    className={`flex flex-col items-center gap-1 rounded-xl border px-3 py-2.5 text-2xl transition-all hover:scale-110
                      ${mood === m.value
                        ? 'border-[var(--color-brand)] bg-[var(--color-brand-subtle)] scale-110'
                        : 'border-[var(--color-border)] bg-[var(--color-surface-100)] opacity-50 hover:opacity-100'}`}>
                    {m.emoji}
                    <span className="text-[9px] text-[var(--color-text-muted)] font-medium">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Market notes */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-1">
                Market Notes
              </label>
              <textarea value={marketNotes} onChange={e => setMarketNotes(e.target.value)} rows={4}
                placeholder="What was the market doing today? Any macro events, sector rotations, unusual volume?&#10;&#10;e.g. SPY bounced off key support, tech led, VIX compressed..."
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-100)] px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-[var(--color-brand)] leading-relaxed" />
            </div>

            {/* Lessons learned */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-1">
                Lessons Learned
              </label>
              <textarea value={lessons} onChange={e => setLessons(e.target.value)} rows={4}
                placeholder="What did today teach you? Any mistakes to avoid? What would you do differently?&#10;&#10;e.g. I entered too early without waiting for confirmation..."
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-100)] px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-[var(--color-brand)] leading-relaxed" />
            </div>

            <div className="flex items-center justify-between">
              {saved && <span className="text-xs text-[var(--color-gain-text)]">✓ Saved</span>}
              <button onClick={handleSave} disabled={saving}
                className="ml-auto flex items-center gap-2 rounded-lg bg-[var(--color-brand)] px-5 py-2 text-sm font-medium text-white hover:bg-[var(--color-brand-muted)] disabled:opacity-50 transition-colors">
                <Save size={14} /> {saving ? 'Saving…' : 'Save Entry'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Mood vs P&L chart ── */}
      {chartData.length > 1 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-[var(--color-brand)]" />
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Mood vs P&L (last 90 days)</h2>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mb-3">
            P&L is normalized to the 1–5 mood scale for overlay. Patterns between emotional state and performance can reveal useful insights.
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a38" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={false} minTickGap={30} />
              <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                formatter={(v, name) => name === 'Mood' ? [MOODS.find(m => m.value === v)?.emoji + ' ' + v, name] : [v?.toFixed(2), name]}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="mood" name="Mood" stroke="#60a5fa" strokeWidth={2} dot={{ r: 3 }} connectNulls />
              <Line type="monotone" dataKey="normalizedPnl" name="P&L (normalized)" stroke="#34d399" strokeWidth={2} dot={false} strokeDasharray="5 3" connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {chartData.length === 0 && (
        <div className="card flex flex-col items-center justify-center gap-3 py-12 text-center">
          <BookOpen size={32} className="text-[var(--color-text-muted)] opacity-40" />
          <p className="text-sm text-[var(--color-text-muted)]">Save a few journal entries with a mood to see the mood-vs-P&L chart</p>
        </div>
      )}
    </div>
  );
}
