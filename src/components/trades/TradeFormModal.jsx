/**
 * components/trades/TradeFormModal.jsx
 * Multi-section trade entry / edit modal.
 * Sections: Details → Risk & Result → Strategy & Tags → Screenshots → Notes
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { createTrade, updateTrade } from '@/features/trades/tradesSlice';
import { selectAccounts } from '@/features/accounts/accountsSlice';
import { apiUploadScreenshot } from '@/api/trades';
import { addToast } from '@/features/ui/toastSlice';
import Modal from '@/components/ui/Modal';
import {
  TrendingUp, TrendingDown, Upload, X, ChevronRight, ChevronLeft,
  DollarSign, AlertCircle,
} from 'lucide-react';

// ─── Validation ───────────────────────────────────────────────────────────────

const tradeSchema = z.object({
  accountId:      z.string().min(1, 'Account required'),
  symbol:         z.string().min(1, 'Symbol required').max(20),
  assetClass:     z.enum(['stock','forex','crypto','futures','options']),
  direction:      z.enum(['long','short']),
  status:         z.enum(['open','closed']),
  entryDate:      z.string().min(1, 'Entry date required'),
  exitDate:       z.string().optional().nullable(),
  entryPrice:     z.coerce.number().positive('Entry price must be positive'),
  exitPrice:      z.coerce.number().positive().optional().nullable(),
  quantity:       z.coerce.number().positive('Quantity must be positive'),
  stopLoss:       z.coerce.number().positive().optional().nullable(),
  takeProfit:     z.coerce.number().positive().optional().nullable(),
  fees:           z.coerce.number().min(0).default(0),
  strategyId:     z.string().optional().nullable(),
  tags:           z.array(z.string()).default([]),
  emotion:        z.string().optional(),
  executionGrade: z.string().optional(),
  notes:          z.string().optional(),
}).refine((d) => {
  if (d.status === 'closed') return !!d.exitPrice && !!d.exitDate;
  return true;
}, { message: 'Exit price and date are required for closed trades', path: ['exitPrice'] });

// ─── Field styles ─────────────────────────────────────────────────────────────

const inputCls = 'w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-100)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-brand)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand)] transition-colors';
const labelCls = 'block text-xs font-medium text-[var(--color-text-secondary)] mb-1';
const errCls   = 'mt-1 text-xs text-[var(--color-loss-text)]';
const sectionTitle = 'text-sm font-semibold text-[var(--color-text-primary)] mb-4';

const STEPS = ['Details', 'Risk & Result', 'Strategy & Tags', 'Screenshots', 'Notes'];

const EMOTIONS = ['confident','fearful','fomo','revenge','disciplined','neutral'];
const GRADES   = ['A','B','C','D','F'];

// ─── Live P&L calculator ──────────────────────────────────────────────────────

function calcLivePnl(values) {
  const { direction, entryPrice, exitPrice, quantity, fees, stopLoss } = values;
  const ep = Number(entryPrice), xp = Number(exitPrice), qty = Number(quantity), f = Number(fees) || 0;
  if (!ep || !xp || !qty) return { pnl: null, rMultiple: null };
  const raw = direction === 'short' ? (ep - xp) * qty : (xp - ep) * qty;
  const pnl = raw - f;
  let rMultiple = null;
  if (stopLoss) {
    const riskUnit = Math.abs(ep - Number(stopLoss));
    if (riskUnit > 0) rMultiple = pnl / (riskUnit * qty);
  }
  return { pnl, rMultiple };
}

// ─── Tag input ────────────────────────────────────────────────────────────────

function TagInput({ value = [], onChange }) {
  const [input, setInput] = useState('');
  const add = () => {
    const t = input.trim().toLowerCase();
    if (t && !value.includes(t)) onChange([...value, t]);
    setInput('');
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {value.map((tag) => (
        <span key={tag} className="flex items-center gap-1 rounded-full bg-[var(--color-brand-subtle)] px-2 py-0.5 text-xs text-[var(--color-brand)]">
          {tag}
          <button type="button" onClick={() => onChange(value.filter(t => t !== tag))}><X size={10} /></button>
        </span>
      ))}
      <input
        className="flex-1 min-w-[120px] rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-100)] px-2 py-1 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand)]"
        placeholder="Add tag, press Enter"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
      />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const TradeFormModal = ({ open, onClose, initialData = null, defaultAccountId = null, onSaved }) => {
  const dispatch   = useDispatch();
  const accounts   = useSelector(selectAccounts);
  const [step, setStep]           = useState(0);
  const [addAnother, setAddAnother] = useState(false);
  const [screenshots, setScreenshots] = useState(initialData?.screenshots || []);
  const [uploading, setUploading] = useState(false);
  const isEdit = !!initialData;

  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(tradeSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          accountId: initialData.accountId?._id || initialData.accountId || '',
          entryDate: initialData.entryDate?.slice(0, 16) || '',
          exitDate:  initialData.exitDate?.slice(0, 16)  || '',
          tags: initialData.tags || [],
        }
      : {
          accountId:   defaultAccountId || accounts[0]?._id || '',
          symbol:      '',
          assetClass:  'stock',
          direction:   'long',
          status:      'open',
          entryDate:   new Date().toISOString().slice(0, 16),
          exitDate:    '',
          entryPrice:  '',
          exitPrice:   '',
          quantity:    '',
          stopLoss:    '',
          takeProfit:  '',
          fees:        0,
          tags:        [],
          emotion:     '',
          executionGrade: '',
          notes:       '',
        },
  });

  // Reset when modal closes/opens
  useEffect(() => {
    if (!open) { reset(); setStep(0); setScreenshots(initialData?.screenshots || []); }
  }, [open]);

  const watchedValues = watch(['direction','entryPrice','exitPrice','quantity','fees','stopLoss','status']);
  const statusVal     = watch('status');
  const { pnl, rMultiple } = calcLivePnl({
    direction: watchedValues[0], entryPrice: watchedValues[1],
    exitPrice:  watchedValues[2], quantity:   watchedValues[3],
    fees:       watchedValues[4], stopLoss:   watchedValues[5],
  });

  // Screenshot upload
  const handleScreenshotUpload = async (files) => {
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append('screenshot', file);
        const res = await apiUploadScreenshot(fd);
        setScreenshots(prev => [...prev, { url: res.data.data.url, caption: '' }]);
      }
    } catch {
      dispatch(addToast({ message: 'Screenshot upload failed.', type: 'error' }));
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data) => {
    const payload = { ...data, screenshots };
    // Remove empty exit fields for open trades
    if (data.status === 'open') { payload.exitPrice = null; payload.exitDate = null; }

    try {
      if (isEdit) {
        await dispatch(updateTrade({ id: initialData._id, data: payload })).unwrap();
        dispatch(addToast({ message: 'Trade updated.', type: 'success' }));
      } else {
        await dispatch(createTrade(payload)).unwrap();
        dispatch(addToast({ message: 'Trade logged!', type: 'success' }));
      }
      onSaved?.();
      if (addAnother) { reset(); setStep(0); setScreenshots([]); }
      else onClose();
    } catch (err) {
      dispatch(addToast({ message: err || 'Failed to save trade.', type: 'error' }));
    }
  };

  // ── Step components ────────────────────────────────────────────────────────

  const StepDetails = () => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {/* Account */}
      <div className="sm:col-span-2">
        <label className={labelCls}>Account *</label>
        <select className={inputCls} {...register('accountId')}>
          {accounts.map(a => <option key={a._id} value={a._id}>{a.name} ({a.currency})</option>)}
        </select>
        {errors.accountId && <p className={errCls}>{errors.accountId.message}</p>}
      </div>

      {/* Symbol */}
      <div>
        <label className={labelCls}>Symbol *</label>
        <input className={`${inputCls} uppercase`} placeholder="AAPL" {...register('symbol')}
          onChange={e => setValue('symbol', e.target.value.toUpperCase())} />
        {errors.symbol && <p className={errCls}>{errors.symbol.message}</p>}
      </div>

      {/* Asset class */}
      <div>
        <label className={labelCls}>Asset Class *</label>
        <select className={inputCls} {...register('assetClass')}>
          {['stock','forex','crypto','futures','options'].map(v => (
            <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Direction */}
      <div>
        <label className={labelCls}>Direction *</label>
        <div className="flex gap-2">
          {['long','short'].map(d => (
            <button key={d} type="button"
              onClick={() => setValue('direction', d)}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors border
                ${watch('direction') === d
                  ? d === 'long'
                    ? 'border-[var(--color-gain)] bg-[var(--color-gain-subtle)] text-[var(--color-gain-text)]'
                    : 'border-[var(--color-loss)] bg-[var(--color-loss-subtle)] text-[var(--color-loss-text)]'
                  : 'border-[var(--color-border)] bg-transparent text-[var(--color-text-secondary)]'}`}
            >
              {d === 'long' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Status */}
      <div>
        <label className={labelCls}>Status *</label>
        <div className="flex gap-2">
          {['open','closed'].map(s => (
            <button key={s} type="button"
              onClick={() => setValue('status', s)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors border
                ${watch('status') === s
                  ? 'border-[var(--color-brand)] bg-[var(--color-brand-subtle)] text-[var(--color-brand)]'
                  : 'border-[var(--color-border)] bg-transparent text-[var(--color-text-secondary)]'}`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Entry date */}
      <div>
        <label className={labelCls}>Entry Date & Time *</label>
        <input type="datetime-local" className={inputCls} {...register('entryDate')} />
        {errors.entryDate && <p className={errCls}>{errors.entryDate.message}</p>}
      </div>

      {/* Exit date (only if closed) */}
      {statusVal === 'closed' && (
        <div>
          <label className={labelCls}>Exit Date & Time *</label>
          <input type="datetime-local" className={inputCls} {...register('exitDate')} />
        </div>
      )}

      {/* Entry price */}
      <div>
        <label className={labelCls}>Entry Price *</label>
        <input type="number" step="any" className={inputCls} placeholder="0.00" {...register('entryPrice')} />
        {errors.entryPrice && <p className={errCls}>{errors.entryPrice.message}</p>}
      </div>

      {/* Exit price (only if closed) */}
      {statusVal === 'closed' && (
        <div>
          <label className={labelCls}>Exit Price *</label>
          <input type="number" step="any" className={inputCls} placeholder="0.00" {...register('exitPrice')} />
          {errors.exitPrice && <p className={errCls}>{errors.exitPrice.message}</p>}
        </div>
      )}

      {/* Quantity */}
      <div>
        <label className={labelCls}>Quantity *</label>
        <input type="number" step="any" className={inputCls} placeholder="100" {...register('quantity')} />
        {errors.quantity && <p className={errCls}>{errors.quantity.message}</p>}
      </div>

      {/* Fees */}
      <div>
        <label className={labelCls}>Fees</label>
        <input type="number" step="any" className={inputCls} placeholder="0" {...register('fees')} />
      </div>
    </div>
  );

  const StepRisk = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Stop Loss</label>
          <input type="number" step="any" className={inputCls} placeholder="0.00" {...register('stopLoss')} />
        </div>
        <div>
          <label className={labelCls}>Take Profit</label>
          <input type="number" step="any" className={inputCls} placeholder="0.00" {...register('takeProfit')} />
        </div>
      </div>

      {/* Live computed display */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-100)] p-4 space-y-3">
        <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Live Calculation</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-[var(--color-text-muted)]">Projected P&L</p>
            <p className={`text-xl font-bold font-num ${pnl == null ? 'text-[var(--color-text-muted)]' : pnl >= 0 ? 'text-[var(--color-gain-text)]' : 'text-[var(--color-loss-text)]'}`}>
              {pnl == null ? '—' : `${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}`}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-muted)]">R-Multiple</p>
            <p className={`text-xl font-bold font-num ${rMultiple == null ? 'text-[var(--color-text-muted)]' : rMultiple >= 0 ? 'text-[var(--color-gain-text)]' : 'text-[var(--color-loss-text)]'}`}>
              {rMultiple == null ? '—' : `${rMultiple >= 0 ? '+' : ''}${rMultiple.toFixed(2)}R`}
            </p>
          </div>
        </div>
        {!watch('stopLoss') && <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1"><AlertCircle size={12} /> Set stop loss to see R-multiple</p>}
      </div>
    </div>
  );

  const StepStrategy = () => (
    <div className="space-y-4">
      {/* Emotion */}
      <div>
        <label className={labelCls}>Emotion</label>
        <div className="flex flex-wrap gap-2">
          {EMOTIONS.map(e => (
            <button key={e} type="button"
              onClick={() => setValue('emotion', watch('emotion') === e ? '' : e)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors border capitalize
                ${watch('emotion') === e
                  ? 'border-[var(--color-brand)] bg-[var(--color-brand-subtle)] text-[var(--color-brand)]'
                  : 'border-[var(--color-border)] bg-transparent text-[var(--color-text-secondary)] hover:border-[var(--color-text-muted)]'}`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Execution grade */}
      <div>
        <label className={labelCls}>Execution Grade</label>
        <div className="flex gap-2">
          {GRADES.map(g => {
            const colors = { A:'emerald', B:'blue', C:'yellow', D:'orange', F:'red' };
            const c = colors[g];
            const active = watch('executionGrade') === g;
            return (
              <button key={g} type="button"
                onClick={() => setValue('executionGrade', active ? '' : g)}
                className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all border
                  ${active
                    ? `border-${c}-500 bg-${c}-900/30 text-${c}-400`
                    : 'border-[var(--color-border)] bg-transparent text-[var(--color-text-muted)] hover:border-[var(--color-text-muted)]'}`}
              >
                {g}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className={labelCls}>Tags</label>
        <Controller
          name="tags"
          control={control}
          render={({ field }) => <TagInput value={field.value} onChange={field.onChange} />}
        />
      </div>
    </div>
  );

  const StepScreenshots = () => (
    <div className="space-y-4">
      {/* Drop zone */}
      <label
        className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface-100)] p-8 cursor-pointer hover:border-[var(--color-brand)] transition-colors"
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleScreenshotUpload(e.dataTransfer.files); }}
      >
        <Upload size={24} className="text-[var(--color-text-muted)]" />
        <span className="text-sm text-[var(--color-text-secondary)]">
          {uploading ? 'Uploading…' : 'Drag & drop or click to upload screenshots'}
        </span>
        <input type="file" accept="image/*" multiple className="hidden"
          onChange={e => handleScreenshotUpload(e.target.files)} />
      </label>

      {/* Previews */}
      {screenshots.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {screenshots.map((s, i) => (
            <div key={i} className="relative group rounded-lg overflow-hidden border border-[var(--color-border)]">
              <img src={s.url} alt={s.caption} className="w-full h-28 object-cover" />
              <button type="button"
                onClick={() => setScreenshots(prev => prev.filter((_, j) => j !== i))}
                className="absolute top-1 right-1 rounded-full bg-black/60 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} className="text-white" />
              </button>
              <input
                className="w-full bg-[var(--color-surface)] px-2 py-1 text-xs text-[var(--color-text-secondary)] focus:outline-none"
                placeholder="Caption…"
                value={s.caption}
                onChange={e => setScreenshots(prev => prev.map((ss, j) => j === i ? { ...ss, caption: e.target.value } : ss))}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const StepNotes = () => (
    <div>
      <label className={labelCls}>Trade Notes (thesis, execution, lessons)</label>
      <textarea
        className={`${inputCls} min-h-[240px] resize-y font-mono text-sm`}
        placeholder="Write your trade thesis, what happened, and lessons learned. Supports Markdown."
        {...register('notes')}
      />
      <p className="mt-1 text-xs text-[var(--color-text-muted)]">Markdown supported: **bold**, *italic*, - lists</p>
    </div>
  );

  const stepComponents = [<StepDetails />, <StepRisk />, <StepStrategy />, <StepScreenshots />, <StepNotes />];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit Trade — ${initialData?.symbol}` : 'Log a Trade'}
      size="lg"
    >
      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-6 -mx-6 px-6 pb-4 border-b border-[var(--color-border)]">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <button
              type="button"
              onClick={() => setStep(i)}
              className={`flex-1 text-center text-xs py-1.5 rounded-lg font-medium transition-colors
                ${i === step
                  ? 'bg-[var(--color-brand-subtle)] text-[var(--color-brand)]'
                  : i < step
                    ? 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                    : 'text-[var(--color-text-muted)]'}`}
            >
              {i + 1}. {s}
            </button>
            {i < STEPS.length - 1 && <div className="w-3 h-px bg-[var(--color-border)]" />}
          </React.Fragment>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="min-h-[320px]">
          {stepComponents[step]}
        </div>

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between border-t border-[var(--color-border)] pt-4">
          <button
            type="button"
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            className="flex items-center gap-1 rounded-lg px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} /> Back
          </button>

          <div className="flex items-center gap-2">
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep(s => Math.min(STEPS.length - 1, s + 1))}
                className="flex items-center gap-1 rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-brand-muted)] transition-colors"
              >
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <>
                {!isEdit && (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    onClick={() => setAddAnother(true)}
                    className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] disabled:opacity-50 transition-colors"
                  >
                    Save & add another
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  onClick={() => setAddAnother(false)}
                  className="rounded-lg bg-[var(--color-brand)] px-5 py-2 text-sm font-medium text-white hover:bg-[var(--color-brand-muted)] disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Saving…' : isEdit ? 'Update Trade' : 'Save Trade'}
                </button>
              </>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default TradeFormModal;
