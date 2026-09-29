/**
 * pages/app/WatchlistPage.jsx
 * Manual watchlist — no live prices, journaling tool only.
 */
import React, { useEffect, useState } from 'react';
import { Eye, Plus, Trash2, Edit2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { apiListWatchlist, apiAddWatchlist, apiUpdateWatchlist, apiDeleteWatchlist } from '@/api/watchlist';

const PRIORITY_COLOR = {
  high:   'text-[var(--color-loss-text)] border-[var(--color-loss)]/30 bg-[var(--color-loss-subtle)]',
  medium: 'text-[var(--color-warning)] border-[var(--color-warning)]/30 bg-[var(--color-warning-subtle)]',
  low:    'text-[var(--color-text-muted)] border-[var(--color-border)] bg-[var(--color-surface-100)]',
};

const EMPTY_FORM = { symbol: '', notes: '', targetEntry: '', targetStop: '', direction: '', priority: 'medium' };

export default function WatchlistPage() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setItems((await apiListWatchlist()).data.data || []); }
    catch { setItems([]); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.symbol.trim()) return;
    const payload = {
      symbol:      form.symbol.toUpperCase(),
      notes:       form.notes,
      targetEntry: form.targetEntry ? parseFloat(form.targetEntry) : null,
      targetStop:  form.targetStop  ? parseFloat(form.targetStop)  : null,
      direction:   form.direction,
      priority:    form.priority,
    };
    try {
      if (editing) {
        const res = await apiUpdateWatchlist(editing, payload);
        setItems(prev => prev.map(x => x._id === editing ? res.data.data : x));
      } else {
        const res = await apiAddWatchlist(payload);
        setItems(prev => [res.data.data, ...prev]);
      }
      setForm(EMPTY_FORM); setEditing(null); setShowAdd(false);
    } catch { }
  };

  const handleEdit = (item) => {
    setForm({
      symbol: item.symbol, notes: item.notes || '', direction: item.direction || '',
      targetEntry: item.targetEntry ?? '', targetStop: item.targetStop ?? '',
      priority: item.priority,
    });
    setEditing(item._id); setShowAdd(true);
  };

  const handleDelete = async (id) => {
    await apiDeleteWatchlist(id);
    setItems(prev => prev.filter(x => x._id !== id));
  };

  const cancelForm = () => { setForm(EMPTY_FORM); setEditing(null); setShowAdd(false); };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Watchlist</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Manual tracking only — <span className="text-[var(--color-warning)]">no live market data</span>. Use as a trading idea notepad.
          </p>
        </div>
        {!showAdd && (
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 rounded-xl bg-[var(--color-brand)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-brand-muted)] transition-colors shadow-glow">
            <Plus size={16} /> Add Symbol
          </button>
        )}
      </div>

      {/* Add/Edit form */}
      {showAdd && (
        <div className="card border-[var(--color-brand)] space-y-3">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">{editing ? 'Edit Item' : 'Add to Watchlist'}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Symbol *</label>
              <input value={form.symbol} onChange={e => setForm(f => ({ ...f, symbol: e.target.value.toUpperCase() }))}
                placeholder="AAPL" className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-100)] px-3 py-2 text-sm font-semibold uppercase focus:outline-none focus:border-[var(--color-brand)]" />
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Target Entry</label>
              <input type="number" value={form.targetEntry} onChange={e => setForm(f => ({ ...f, targetEntry: e.target.value }))}
                placeholder="150.00" className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-100)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-brand)]" />
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Target Stop</label>
              <input type="number" value={form.targetStop} onChange={e => setForm(f => ({ ...f, targetStop: e.target.value }))}
                placeholder="145.00" className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-100)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-brand)]" />
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Direction</label>
              <select value={form.direction} onChange={e => setForm(f => ({ ...f, direction: e.target.value }))}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-100)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-brand)]">
                <option value="">— any —</option>
                <option value="long">Long</option>
                <option value="short">Short</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-3">
              <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Notes / Thesis</label>
              <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Why is this on your radar? Setup, catalyst, key levels..."
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-100)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-brand)]" />
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Priority</label>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-100)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-brand)]">
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={cancelForm} className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-100)]">Cancel</button>
            <button onClick={handleSave} disabled={!form.symbol.trim()}
              className="rounded-lg bg-[var(--color-brand)] px-5 py-2 text-sm font-medium text-white hover:bg-[var(--color-brand-muted)] disabled:opacity-50 transition-colors">
              {editing ? 'Save' : 'Add'}
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
        </div>
      )}

      {!loading && items.length === 0 && !showAdd && (
        <div className="card flex flex-col items-center justify-center gap-3 py-16 text-center">
          <Eye size={32} className="text-[var(--color-text-muted)] opacity-40" />
          <p className="text-sm text-[var(--color-text-muted)]">Your watchlist is empty — add symbols you're monitoring</p>
        </div>
      )}

      {/* List */}
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map(item => {
            const rrRatio = item.targetEntry && item.targetStop
              ? null // no TP stored — just show stop distance
              : null;
            const stopDist = item.targetEntry && item.targetStop
              ? Math.abs(item.targetEntry - item.targetStop)
              : null;

            return (
              <div key={item._id} className="card flex items-center gap-4 py-3">
                <div className="flex items-center gap-2 w-28 shrink-0">
                  {item.direction === 'long'  && <TrendingUp  size={14} className="text-[var(--color-gain-text)]" />}
                  {item.direction === 'short' && <TrendingDown size={14} className="text-[var(--color-loss-text)]" />}
                  {!item.direction && <Minus size={14} className="text-[var(--color-text-muted)]" />}
                  <span className="font-bold text-[var(--color-text-primary)] font-num">{item.symbol}</span>
                  <span className={`text-[9px] uppercase font-bold border rounded px-1 py-0.5 ${PRIORITY_COLOR[item.priority]}`}>
                    {item.priority}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)] flex-1 flex-wrap">
                  {item.targetEntry && <span>Entry: <span className="font-num font-medium text-[var(--color-text-secondary)]">${item.targetEntry}</span></span>}
                  {item.targetStop  && <span>Stop: <span className="font-num font-medium text-[var(--color-loss-text)]">${item.targetStop}</span></span>}
                  {stopDist && <span>Risk: <span className="font-num font-medium text-[var(--color-text-secondary)]">${stopDist.toFixed(2)}/unit</span></span>}
                  {item.notes && <span className="text-[var(--color-text-muted)] italic truncate max-w-[200px]">{item.notes}</span>}
                </div>

                <div className="flex gap-1 shrink-0">
                  <button onClick={() => handleEdit(item)} className="rounded p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-brand)] transition-colors"><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete(item._id)} className="rounded p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-loss-text)] transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
