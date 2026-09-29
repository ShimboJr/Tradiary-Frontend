/**
 * pages/app/PlaybooksPage.jsx
 * Strategy list + inline builder modal.
 */
import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, GripVertical, ChevronRight, BookMarked, Edit2 } from 'lucide-react';
import {
  fetchStrategies, createStrategy, updateStrategy, deleteStrategy,
  selectStrategies, selectStrategiesStatus,
} from '@/features/strategies/strategiesSlice';
import { addToast } from '@/features/ui/toastSlice';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';

const RULE_PLACEHOLDER = [
  'Price above 200 EMA',
  'Volume > 1.5× average',
  'RSI between 40–60 on entry',
  'Risk ≤ 1% of account',
  'Confirmed daily trend direction',
];

const COLOR_OPTS = [
  '#3b8ef3','#a855f7','#22c55e','#f59e0b','#ef4444','#06b6d4','#ec4899','#f97316',
];

// ─── Strategy builder modal ───────────────────────────────────────────────────

function StrategyModal({ open, onClose, initialData, onSaved }) {
  const dispatch = useDispatch();
  const [name, setName]         = useState('');
  const [desc, setDesc]         = useState('');
  const [color, setColor]       = useState('#3b8ef3');
  const [rules, setRules]       = useState([]);
  const [ruleText, setRuleText] = useState('');
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    if (open) {
      setName(initialData?.name || '');
      setDesc(initialData?.description || '');
      setColor(initialData?.color || '#3b8ef3');
      setRules(initialData?.rules || []);
      setRuleText('');
    }
  }, [open, initialData]);

  const addRule = () => {
    if (!ruleText.trim()) return;
    setRules(r => [...r, { text: ruleText.trim(), order: r.length }]);
    setRuleText('');
  };

  const removeRule = (i) => setRules(r => r.filter((_, idx) => idx !== i));

  const moveRule = (from, to) => {
    if (to < 0 || to >= rules.length) return;
    const next = [...rules];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setRules(next.map((r, i) => ({ ...r, order: i })));
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const payload = { name, description: desc, color, rules: rules.map((r, i) => ({ ...r, order: i })) };
      if (initialData?._id) {
        await dispatch(updateStrategy({ id: initialData._id, data: payload })).unwrap();
        dispatch(addToast({ message: 'Strategy updated.', type: 'success' }));
      } else {
        await dispatch(createStrategy(payload)).unwrap();
        dispatch(addToast({ message: 'Strategy created.', type: 'success' }));
      }
      onSaved?.();
      onClose();
    } catch (err) {
      dispatch(addToast({ message: String(err), type: 'error' }));
    } finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={initialData ? 'Edit Strategy' : 'New Strategy'} size="lg">
      <div className="space-y-4">
        {/* Name + color */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Strategy Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. EMA Pullback"
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-100)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-brand)]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Color</label>
            <div className="flex gap-1.5 flex-wrap mt-1">
              {COLOR_OPTS.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${color === c ? 'border-white scale-110' : 'border-transparent'}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Description</label>
          <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2}
            placeholder="When to use this strategy, market conditions, timeframes..."
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-100)] px-3 py-2 text-sm resize-none focus:outline-none focus:border-[var(--color-brand)]" />
        </div>

        {/* Rules builder */}
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-2">
            Checklist Rules ({rules.length})
          </label>
          <div className="space-y-1.5 mb-2 max-h-48 overflow-y-auto pr-1">
            {rules.map((r, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-100)] px-2 py-1.5 group">
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => moveRule(i, i-1)} disabled={i === 0}
                    className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-20 leading-none text-[10px]">▲</button>
                  <button onClick={() => moveRule(i, i+1)} disabled={i === rules.length-1}
                    className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-20 leading-none text-[10px]">▼</button>
                </div>
                <span className="flex-1 text-xs text-[var(--color-text-secondary)]">{r.text}</span>
                <button onClick={() => removeRule(i)}
                  className="opacity-0 group-hover:opacity-100 text-[var(--color-loss-text)] hover:text-[var(--color-loss)] transition-opacity">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            {rules.length === 0 && (
              <p className="text-xs text-[var(--color-text-muted)] italic py-2 text-center">
                No rules yet — add your entry criteria below
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <input value={ruleText} onChange={e => setRuleText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addRule()}
              placeholder={RULE_PLACEHOLDER[rules.length % RULE_PLACEHOLDER.length]}
              className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-100)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-brand)]" />
            <button onClick={addRule}
              className="rounded-lg bg-[var(--color-brand-subtle)] px-3 py-2 text-sm text-[var(--color-brand)] hover:bg-[var(--color-brand)] hover:text-white transition-colors">
              <Plus size={16} />
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-100)]">
            Cancel
          </button>
          <button onClick={handleSave} disabled={!name.trim() || saving}
            className="rounded-lg bg-[var(--color-brand)] px-5 py-2 text-sm font-medium text-white hover:bg-[var(--color-brand-muted)] disabled:opacity-50 transition-colors">
            {saving ? 'Saving…' : initialData ? 'Save Changes' : 'Create Strategy'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Strategy card ────────────────────────────────────────────────────────────

function StrategyCard({ strategy, onEdit, onDelete }) {
  const navigate = useNavigate();
  return (
    <div className="card group cursor-pointer hover:border-[var(--color-brand)] transition-colors"
      onClick={() => navigate(`/app/playbooks/${strategy._id}`)}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-3 w-3 rounded-full shrink-0" style={{ background: strategy.color }} />
          <h3 className="font-semibold text-[var(--color-text-primary)] leading-tight">{strategy.name}</h3>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
          <button onClick={() => onEdit(strategy)} className="rounded p-1 text-[var(--color-text-muted)] hover:text-[var(--color-brand)]"><Edit2 size={14} /></button>
          <button onClick={() => onDelete(strategy)} className="rounded p-1 text-[var(--color-text-muted)] hover:text-[var(--color-loss-text)]"><Trash2 size={14} /></button>
        </div>
      </div>
      {strategy.description && (
        <p className="text-xs text-[var(--color-text-muted)] mb-3 line-clamp-2">{strategy.description}</p>
      )}
      <div className="flex items-center gap-3">
        <span className="text-xs text-[var(--color-text-muted)]">
          {strategy.rules.length} rule{strategy.rules.length !== 1 ? 's' : ''}
        </span>
        {strategy.rules.slice(0, 2).map((r, i) => (
          <span key={i} className="text-xs bg-[var(--color-surface-200)] rounded px-1.5 py-0.5 text-[var(--color-text-muted)] truncate max-w-[120px]">
            {r.text}
          </span>
        ))}
        {strategy.rules.length > 2 && <span className="text-xs text-[var(--color-text-muted)]">+{strategy.rules.length - 2} more</span>}
      </div>
      <div className="flex items-center justify-end mt-2 text-[var(--color-brand)] opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight size={16} />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlaybooksPage() {
  const dispatch   = useDispatch();
  const strategies = useSelector(selectStrategies);
  const status     = useSelector(selectStrategiesStatus);
  const [showModal, setShowModal]   = useState(false);
  const [editing, setEditing]       = useState(null);
  const [toDelete, setToDelete]     = useState(null);

  useEffect(() => { dispatch(fetchStrategies()); }, []);

  const handleDelete = async (s) => {
    if (!window.confirm(`Delete "${s.name}"? This will not delete associated trades.`)) return;
    await dispatch(deleteStrategy(s._id));
    dispatch(addToast({ message: 'Strategy deleted.', type: 'success' }));
  };

  const openCreate = () => { setEditing(null); setShowModal(true); };
  const openEdit   = (s) => { setEditing(s); setShowModal(true); };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Playbooks</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Define your trading strategies with entry rules and track their performance</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-[var(--color-brand)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-brand-muted)] transition-colors shadow-glow">
          <Plus size={16} /> New Strategy
        </button>
      </div>

      {status === 'loading' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-32 rounded-xl" />)}
        </div>
      )}

      {status !== 'loading' && strategies.length === 0 && (
        <div className="card flex flex-col items-center justify-center gap-3 py-20 text-center">
          <div className="rounded-full bg-[var(--color-brand-subtle)] p-5">
            <BookMarked size={32} className="text-[var(--color-brand)]" />
          </div>
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">No strategies yet</h2>
          <p className="text-sm text-[var(--color-text-muted)] max-w-sm">
            Create your first trading strategy with entry rules to start tracking discipline and performance.
          </p>
          <button onClick={openCreate}
            className="mt-2 rounded-lg bg-[var(--color-brand)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-brand-muted)] transition-colors">
            Create First Strategy
          </button>
        </div>
      )}

      {strategies.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {strategies.map(s => (
            <StrategyCard key={s._id} strategy={s} onEdit={openEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <StrategyModal
        open={showModal}
        onClose={() => setShowModal(false)}
        initialData={editing}
        onSaved={() => {}}
      />
    </div>
  );
}
