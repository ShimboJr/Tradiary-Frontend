/**
 * pages/app/TradeDetailPage.jsx
 * Full detail view: screenshot gallery + lightbox, rendered notes, related trades,
 * edit/delete, and a Replay tab for closed trades.
 */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { format } from 'date-fns';
import {
  ArrowLeft, Edit2, Trash2, Copy, ExternalLink,
  TrendingUp, TrendingDown, Film,
} from 'lucide-react';
import { fetchTrade, deleteTrade, selectTrade, selectTradesStatus, clearSelected } from '@/features/trades/tradesSlice';
import { addToast } from '@/features/ui/toastSlice';
import { apiListTrades } from '@/api/trades';
import TradeFormModal from '@/components/trades/TradeFormModal';
import TradeReplayTab from '@/components/trades/TradeReplayTab';
import Lightbox from '@/components/ui/Lightbox';
import Badge from '@/components/ui/Badge';
import SourceBadge from '@/components/trades/SourceBadge';

const fmt = (n, d = 2) => n == null ? '—' : n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

const StatCard = ({ label, value, className = '' }) => (
  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-100)] p-4">
    <p className="text-xs text-[var(--color-text-muted)] mb-1">{label}</p>
    <p className={`text-lg font-bold font-num ${className}`}>{value}</p>
  </div>
);

const EMOTION_EMOJI = {
  confident: '💪', fearful: '😨', fomo: '😰', revenge: '😤', disciplined: '🧘', neutral: '😐',
};

const TABS = [
  { id: 'overview', label: 'Overview', icon: null,  closedOnly: false },
  { id: 'replay',   label: 'Replay',   icon: Film,  closedOnly: true  },
];

export default function TradeDetailPage() {
  const { id }   = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const trade    = useSelector(selectTrade);
  const status   = useSelector(selectTradesStatus);

  const [activeTab, setActiveTab]         = useState('overview');
  const [showEdit, setShowEdit]           = useState(false);
  const [showDelete, setShowDelete]       = useState(false);
  const [lightboxIdx, setLightboxIdx]     = useState(null);
  const [relatedTrades, setRelatedTrades] = useState([]);

  useEffect(() => {
    dispatch(fetchTrade(id));
    return () => dispatch(clearSelected());
  }, [id]);

  // Reset to overview when navigating to a different trade
  useEffect(() => { setActiveTab('overview'); }, [id]);

  // Load related trades (same symbol, last 5 except current)
  useEffect(() => {
    if (!trade?.symbol) return;
    apiListTrades({ symbol: trade.symbol, limit: 6, sortBy: 'entryDate', sortDir: 'desc' })
      .then(res => setRelatedTrades(res.data.data.trades.filter(t => t._id !== id).slice(0, 5)))
      .catch(() => {});
  }, [trade?.symbol, id]);

  const handleDelete = async () => {
    try {
      await dispatch(deleteTrade(id)).unwrap();
      dispatch(addToast({ message: 'Trade deleted.', type: 'success' }));
      navigate('/app/trades');
    } catch {
      dispatch(addToast({ message: 'Delete failed.', type: 'error' }));
    }
  };

  const handleDuplicate = () => {
    if (!trade) return;
    navigate('/app/trades', { state: { duplicate: trade } });
  };

  if (status === 'loading' || !trade || trade._id !== id) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-20 w-full rounded-xl" />)}
      </div>
    );
  }

  const pnlCls = trade.pnl == null
    ? 'text-[var(--color-text-muted)]'
    : trade.pnl >= 0 ? 'text-[var(--color-gain-text)]' : 'text-[var(--color-loss-text)]';

  const visibleTabs = TABS.filter(t => !t.closedOnly || trade.status === 'closed');

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/app/trades"
            className="flex-shrink-0 rounded-lg p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-200)] transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{trade.symbol}</h1>
            <SourceBadge source={trade.source} showLabel />
            <Badge variant={trade.direction}>
              {trade.direction === 'long'
                ? <TrendingUp   size={12} className="inline mr-1" />
                : <TrendingDown size={12} className="inline mr-1" />}
              {trade.direction}
            </Badge>
            <Badge variant={trade.status}>{trade.status}</Badge>
            {trade.executionGrade && <Badge variant={trade.executionGrade}>{trade.executionGrade}</Badge>}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleDuplicate}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] transition-colors"
          >
            <Copy size={14} /> Duplicate
          </button>
          <button
            onClick={() => setShowEdit(true)}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] transition-colors"
          >
            <Edit2 size={14} /> Edit
          </button>
          <button
            onClick={() => setShowDelete(true)}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--color-loss)] bg-[var(--color-loss-subtle)] px-3 py-1.5 text-sm text-[var(--color-loss-text)] hover:opacity-80 transition-colors"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      {/* ── Stats grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="P&L"
          value={trade.pnl != null ? `${trade.pnl >= 0 ? '+' : ''}${fmt(trade.pnl)}` : '—'}
          className={pnlCls}
        />
        <StatCard
          label="R-Multiple"
          value={trade.rMultiple != null ? `${trade.rMultiple >= 0 ? '+' : ''}${trade.rMultiple.toFixed(2)}R` : '—'}
          className={trade.rMultiple >= 0 ? 'text-[var(--color-gain-text)]' : 'text-[var(--color-loss-text)]'}
        />
        <StatCard label="Entry Price"  value={fmt(trade.entryPrice, 4)}                          className="text-[var(--color-text-primary)]" />
        <StatCard label="Exit Price"   value={trade.exitPrice ? fmt(trade.exitPrice, 4) : '—'}   className="text-[var(--color-text-primary)]" />
        <StatCard label="Quantity"     value={fmt(trade.quantity, 0)}                             className="text-[var(--color-text-primary)]" />
        <StatCard label="Fees"         value={fmt(trade.fees)}                                    className="text-[var(--color-text-muted)]" />
        <StatCard label="Stop Loss"    value={trade.stopLoss   ? fmt(trade.stopLoss,   4) : '—'} className="text-[var(--color-loss-text)]" />
        <StatCard label="Take Profit"  value={trade.takeProfit ? fmt(trade.takeProfit, 4) : '—'} className="text-[var(--color-gain-text)]" />
      </div>

      {/* ── Tab bar ────────────────────────────────────────────────────────── */}
      {visibleTabs.length > 1 && (
        <div className="flex gap-1 border-b border-[var(--color-border)]">
          {visibleTabs.map(tab => {
            const Icon     = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`trade-detail-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={[
                  'flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
                  isActive
                    ? 'border-[var(--color-brand)] text-[var(--color-brand)]'
                    : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]',
                ].join(' ')}
              >
                {Icon && <Icon size={14} />}
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* ══════════════════ OVERVIEW TAB ═══════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">

          {/* Details row */}
          <div className="card">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Asset Class</p>
                <p className="font-medium capitalize text-[var(--color-text-primary)] mt-0.5">{trade.assetClass}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Account</p>
                <p className="font-medium text-[var(--color-text-primary)] mt-0.5">{trade.accountId?.name || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Entry Date</p>
                <p className="font-num font-medium text-[var(--color-text-primary)] mt-0.5">
                  {format(new Date(trade.entryDate), 'MMM d, yyyy HH:mm')}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Exit Date</p>
                <p className="font-num font-medium text-[var(--color-text-primary)] mt-0.5">
                  {trade.exitDate ? format(new Date(trade.exitDate), 'MMM d, yyyy HH:mm') : '—'}
                </p>
              </div>
              {trade.emotion && (
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Emotion</p>
                  <p className="font-medium text-[var(--color-text-primary)] mt-0.5 capitalize">
                    {EMOTION_EMOJI[trade.emotion]} {trade.emotion}
                  </p>
                </div>
              )}
              {trade.strategyId?.name && (
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Strategy</p>
                  <Link
                    to={`/app/playbooks/${trade.strategyId._id}`}
                    className="inline-flex items-center gap-1.5 mt-0.5 font-medium text-[var(--color-brand)] hover:underline"
                  >
                    {trade.strategyId.name}
                  </Link>
                </div>
              )}
              {trade.mistakes?.length > 0 && (
                <div className="sm:col-span-4">
                  <p className="text-xs text-[var(--color-text-muted)] mb-1.5">Mistakes</p>
                  <div className="flex flex-wrap gap-1.5">
                    {trade.mistakes.map(m => (
                      <span
                        key={m}
                        className="rounded-full border border-[var(--color-loss)] bg-[var(--color-loss-subtle)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-loss-text)]"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {trade.tags?.length > 0 && (
                <div className="sm:col-span-4">
                  <p className="text-xs text-[var(--color-text-muted)] mb-1.5">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {trade.tags.map(tag => (
                      <span key={tag} className="rounded-full bg-[var(--color-brand-subtle)] px-2 py-0.5 text-xs text-[var(--color-brand)]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Screenshots */}
          {trade.screenshots?.length > 0 && (
            <div className="card">
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Screenshots</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {trade.screenshots.map((s, i) => (
                  <div
                    key={i}
                    className="group relative rounded-lg overflow-hidden border border-[var(--color-border)] cursor-pointer"
                    onClick={() => setLightboxIdx(i)}
                  >
                    <img src={s.url} alt={s.caption} className="w-full h-40 object-cover transition-transform group-hover:scale-105" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <ExternalLink size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {s.caption && (
                      <p className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 text-xs text-white/90 truncate">
                        {s.caption}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {trade.notes && (
            <div className="card">
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Notes</h2>
              <div className="prose prose-sm max-w-none text-[var(--color-text-secondary)] whitespace-pre-wrap font-mono text-sm leading-relaxed">
                {trade.notes}
              </div>
            </div>
          )}

          {/* Related trades */}
          {relatedTrades.length > 0 && (
            <div className="card">
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
                Related — {trade.symbol} (last {relatedTrades.length})
              </h2>
              <div className="space-y-2">
                {relatedTrades.map(t => (
                  <Link
                    key={t._id}
                    to={`/app/trades/${t._id}`}
                    className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-100)] px-3 py-2 hover:border-[var(--color-brand)] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant={t.direction}>{t.direction}</Badge>
                      <span className="text-xs text-[var(--color-text-muted)] font-num">
                        {format(new Date(t.entryDate), 'MMM d, yyyy')}
                      </span>
                      <span className="text-xs text-[var(--color-text-secondary)]">@{fmt(t.entryPrice, 4)}</span>
                    </div>
                    <span className={`text-sm font-semibold font-num ${t.pnl >= 0 ? 'text-[var(--color-gain-text)]' : 'text-[var(--color-loss-text)]'}`}>
                      {t.pnl != null ? `${t.pnl >= 0 ? '+' : ''}${fmt(t.pnl)}` : '—'}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════ REPLAY TAB ══════════════════════════════════════ */}
      {activeTab === 'replay' && (
        <TradeReplayTab trade={trade} />
      )}

      {/* ── Lightbox ──────────────────────────────────────────────────────── */}
      {lightboxIdx !== null && (
        <Lightbox
          images={trade.screenshots}
          index={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onNavigate={setLightboxIdx}
        />
      )}

      {/* ── Edit modal ────────────────────────────────────────────────────── */}
      <TradeFormModal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        initialData={trade}
        onSaved={() => { setShowEdit(false); dispatch(fetchTrade(id)); }}
      />

      {/* ── Delete confirm ────────────────────────────────────────────────── */}
      {showDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)' }}
        >
          <div className="card w-full max-w-sm mx-4">
            <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">Delete this trade?</p>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">
              {trade.symbol} {trade.direction} on {format(new Date(trade.entryDate), 'MMM d, yyyy')} — this cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDelete(false)}
                className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-100)]"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="rounded-lg bg-[var(--color-loss)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
