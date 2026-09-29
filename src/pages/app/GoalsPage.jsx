/**
 * pages/app/GoalsPage.jsx
 * Goals & targets — progress bars with breach detection.
 */
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Target, Plus, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { fetchGoals, createGoal, deleteGoal, selectGoals, selectGoalsStatus } from '@/features/goals/goalsSlice';
import { addToast } from '@/features/ui/toastSlice';
import Modal from '@/components/ui/Modal';

const GOAL_TYPES = [
  { value: 'profit_target', label: 'Profit Target', unit: '$', desc: 'Net P&L goal for the period' },
  { value: 'max_drawdown',  label: 'Max Drawdown Limit', unit: '$', desc: 'Stop trading if drawdown exceeds this' },
  { value: 'trade_count',   label: 'Trade Count', unit: 'trades', desc: 'Number of trades to execute' },
  { value: 'win_rate',      label: 'Win Rate', unit: '%', desc: 'Target win rate for the period' },
];

const typeLabel = (t) => GOAL_TYPES.find(g => g.value === t)?.label || t;
const typeUnit  = (t) => GOAL_TYPES.find(g => g.value === t)?.unit || '';

function GoalCard({ goal }) {
  const dispatch = useDispatch();
  const isDrawdown = goal.type === 'max_drawdown';
  const breached   = goal.breached;
  const pct        = Math.min(goal.progress || 0, 100);

  const barColor = breached
    ? 'bg-[var(--color-loss)]'
    : pct >= 100
      ? 'bg-[var(--color-gain)]'
      : isDrawdown
        ? pct > 75 ? 'bg-[var(--color-warning)]' : 'bg-[var(--color-brand)]'
        : pct > 75 ? 'bg-[var(--color-gain)]' : 'bg-[var(--color-brand)]';

  const handleDelete = async () => {
    if (!window.confirm(`Delete goal "${goal.name || typeLabel(goal.type)}"?`)) return;
    await dispatch(deleteGoal(goal._id));
    dispatch(addToast({ message: 'Goal deleted.', type: 'success' }));
  };

  return (
    <div className={`card relative ${breached ? 'border-[var(--color-loss)]/60 bg-[var(--color-loss-subtle)]' : ''}`}>
      {/* Breach badge */}
      {breached && (
        <div className="absolute -top-2 -right-2 flex items-center gap-1 rounded-full bg-[var(--color-loss)] px-2 py-0.5 text-[10px] font-bold text-white shadow">
          <AlertTriangle size={10} /> LIMIT BREACHED
        </div>
      )}
      {pct >= 100 && !breached && (
        <div className="absolute -top-2 -right-2 flex items-center gap-1 rounded-full bg-[var(--color-gain)] px-2 py-0.5 text-[10px] font-bold text-white shadow">
          <CheckCircle size={10} /> ACHIEVED
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide">{typeLabel(goal.type)} · {goal.period}</p>
          <p className="font-semibold text-[var(--color-text-primary)] mt-0.5">{goal.name || typeLabel(goal.type)}</p>
        </div>
        <button onClick={handleDelete} className="text-[var(--color-text-muted)] hover:text-[var(--color-loss-text)] transition-colors">
          <Trash2 size={14} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-[var(--color-text-muted)]">
            Current: <span className="font-num font-semibold text-[var(--color-text-primary)]">
              {typeUnit(goal.type) === '$' ? '$' : ''}{goal.currentValue?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{typeUnit(goal.type) === '%' ? '%' : typeUnit(goal.type) === 'trades' ? ' trades' : ''}
            </span>
          </span>
          <span className="text-[var(--color-text-muted)]">
            Target: <span className="font-num font-semibold text-[var(--color-text-primary)]">
              {typeUnit(goal.type) === '$' ? '$' : ''}{goal.targetValue?.toLocaleString()}{typeUnit(goal.type) === '%' ? '%' : typeUnit(goal.type) === 'trades' ? ' trades' : ''}
            </span>
          </span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-[var(--color-surface-200)]">
          <div
            className={`h-2.5 rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-right text-xs text-[var(--color-text-muted)] mt-1">{pct.toFixed(1)}%</p>
      </div>

      {breached && (
        <p className="text-xs text-[var(--color-loss-text)] font-medium">
          ⚠️ Drawdown limit exceeded — consider pausing trading to review.
        </p>
      )}
    </div>
  );
}

function AddGoalModal({ open, onClose }) {
  const dispatch = useDispatch();
  const [type,   setType]   = useState('profit_target');
  const [period, setPeriod] = useState('monthly');
  const [target, setTarget] = useState('');
  const [name,   setName]   = useState('');
  const [saving, setSaving] = useState(false);

  const unit = typeUnit(type);

  useEffect(() => { if (open) { setType('profit_target'); setPeriod('monthly'); setTarget(''); setName(''); } }, [open]);

  const handleSave = async () => {
    if (!target) return;
    setSaving(true);
    try {
      await dispatch(createGoal({ name, type, period, targetValue: parseFloat(target) })).unwrap();
      dispatch(addToast({ message: 'Goal created.', type: 'success' }));
      onClose();
    } catch (e) {
      dispatch(addToast({ message: String(e), type: 'error' }));
    } finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Goal">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Goal Name (optional)</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Q4 Profit Target"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-100)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-brand)]" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Goal Type</label>
          <div className="space-y-1.5">
            {GOAL_TYPES.map(g => (
              <label key={g.value}
                className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${type === g.value ? 'border-[var(--color-brand)] bg-[var(--color-brand-subtle)]' : 'border-[var(--color-border)] hover:border-[var(--color-brand)]/50'}`}>
                <input type="radio" name="goalType" value={g.value} checked={type === g.value} onChange={() => setType(g.value)} className="mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">{g.label}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{g.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Period</label>
            <select value={period} onChange={e => setPeriod(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-100)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-brand)]">
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
              Target Value ({unit})
            </label>
            <input type="number" value={target} onChange={e => setTarget(e.target.value)} placeholder={unit === '$' ? '1000' : unit === '%' ? '55' : '20'}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-100)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-brand)]" />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-100)]">Cancel</button>
          <button onClick={handleSave} disabled={!target || saving}
            className="rounded-lg bg-[var(--color-brand)] px-5 py-2 text-sm font-medium text-white hover:bg-[var(--color-brand-muted)] disabled:opacity-50 transition-colors">
            {saving ? 'Creating…' : 'Create Goal'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function GoalsPage() {
  const dispatch = useDispatch();
  const goals    = useSelector(selectGoals);
  const status   = useSelector(selectGoalsStatus);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => { dispatch(fetchGoals()); }, []);

  const breachedGoals = goals.filter(g => g.breached);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Goals & Targets</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Track your performance against self-defined targets for the current period</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 rounded-xl bg-[var(--color-brand)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-brand-muted)] transition-colors shadow-glow">
          <Plus size={16} /> Add Goal
        </button>
      </div>

      {/* Breach alert */}
      {breachedGoals.length > 0 && (
        <div className="rounded-xl border border-[var(--color-loss)]/50 bg-[var(--color-loss-subtle)] px-4 py-3 flex items-center gap-3">
          <AlertTriangle size={18} className="text-[var(--color-loss-text)] shrink-0" />
          <div>
            <p className="text-sm font-semibold text-[var(--color-loss-text)]">
              {breachedGoals.length} limit{breachedGoals.length > 1 ? 's' : ''} breached
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              {breachedGoals.map(g => g.name || typeLabel(g.type)).join(', ')} — consider reviewing your trading.
            </p>
          </div>
        </div>
      )}

      {status === 'loading' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => <div key={i} className="skeleton h-32 rounded-xl" />)}
        </div>
      )}

      {status !== 'loading' && goals.length === 0 && (
        <div className="card flex flex-col items-center justify-center gap-3 py-20 text-center">
          <div className="rounded-full bg-[var(--color-brand-subtle)] p-5">
            <Target size={32} className="text-[var(--color-brand)]" />
          </div>
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">No goals set</h2>
          <p className="text-sm text-[var(--color-text-muted)] max-w-sm">
            Set a profit target, max drawdown limit, or trade count goal to track your progress.
          </p>
          <button onClick={() => setShowAdd(true)}
            className="mt-2 rounded-lg bg-[var(--color-brand)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-brand-muted)] transition-colors">
            Add First Goal
          </button>
        </div>
      )}

      {goals.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {goals.map(g => <GoalCard key={g._id} goal={g} />)}
        </div>
      )}

      <AddGoalModal open={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  );
}
