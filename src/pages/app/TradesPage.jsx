/**
 * pages/app/TradesPage.jsx
 * Trade list with filter bar, sortable table, bulk actions, CSV import/export.
 */
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { formatDate } from '@/utils/format';
import {
  Plus, Download, Upload, Trash2, Tag, Search,
  ChevronUp, ChevronDown, ChevronsUpDown,
  Filter, X, MoreHorizontal, Copy,
} from 'lucide-react';
import SourceBadge from '@/components/trades/SourceBadge';
import {
  fetchTrades, deleteTrade, bulkDeleteTrades, selectTrades,
  selectTradesPagination, selectTradesStatus,
} from '@/features/trades/tradesSlice';
import { fetchAccounts, selectAccounts } from '@/features/accounts/accountsSlice';
import { addToast } from '@/features/ui/toastSlice';
import { apiExportTrades } from '@/api/trades';
import TradeFormModal from '@/components/trades/TradeFormModal';
import CsvImportModal from '@/components/trades/CsvImportModal';
import Badge from '@/components/ui/Badge';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n, digits = 2) =>
  n == null ? '—' : new Intl.NumberFormat('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);

const PnlCell = ({ value }) => {
  if (value == null) return <span className="text-[var(--color-text-muted)]">—</span>;
  const cls = value >= 0 ? 'text-[var(--color-gain-text)]' : 'text-[var(--color-loss-text)]';
  return <span className={`font-num font-semibold ${cls}`}>{value >= 0 ? '+' : ''}{fmt(value)}</span>;
};

const SortIcon = ({ field, sortBy, sortDir }) => {
  if (sortBy !== field) return <ChevronsUpDown size={13} className="text-[var(--color-text-muted)]" />;
  return sortDir === 'asc'
    ? <ChevronUp size={13} className="text-[var(--color-brand)]" />
    : <ChevronDown size={13} className="text-[var(--color-brand)]" />;
};

const rowStripe = (trade) => {
  if (trade.status === 'open') return '';
  if (trade.pnl > 0) return 'border-l-2 border-l-[var(--color-gain)]';
  if (trade.pnl < 0) return 'border-l-2 border-l-[var(--color-loss)]';
  return '';
};

// ─── Filter bar ───────────────────────────────────────────────────────────────

const FilterBar = ({ filters, setFilters, accounts }) => {
  const [symbol, setSymbol] = useState(filters.symbol || '');
  const submit = () => setFilters(f => ({ ...f, symbol: symbol || undefined, page: 1 }));

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {/* Symbol search */}
      <div className="relative">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
        <input
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-100)] pl-8 pr-3 py-1.5 text-sm w-32 focus:outline-none focus:border-[var(--color-brand)] transition-colors uppercase"
          placeholder="Symbol"
          value={symbol}
          onChange={e => setSymbol(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && submit()}
        />
      </div>

      {/* Account */}
      <select
        className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-100)] px-2 py-1.5 text-sm text-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-brand)]"
        value={filters.accountId || ''}
        onChange={e => setFilters(f => ({ ...f, accountId: e.target.value || undefined, page: 1 }))}
      >
        <option value="">All Accounts</option>
        {accounts.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
      </select>

      {/* Direction */}
      <select
        className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-100)] px-2 py-1.5 text-sm text-[var(--color-text-secondary)] focus:outline-none"
        value={filters.direction || ''}
        onChange={e => setFilters(f => ({ ...f, direction: e.target.value || undefined, page: 1 }))}
      >
        <option value="">Direction</option>
        <option value="long">Long</option>
        <option value="short">Short</option>
      </select>

      {/* Status */}
      <select
        className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-100)] px-2 py-1.5 text-sm text-[var(--color-text-secondary)] focus:outline-none"
        value={filters.status || ''}
        onChange={e => setFilters(f => ({ ...f, status: e.target.value || undefined, page: 1 }))}
      >
        <option value="">Status</option>
        <option value="open">Open</option>
        <option value="closed">Closed</option>
      </select>

      {/* Date from */}
      <input
        type="date"
        className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-100)] px-2 py-1.5 text-sm text-[var(--color-text-secondary)] focus:outline-none"
        value={filters.dateFrom || ''}
        onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value || undefined, page: 1 }))}
      />
      <span className="text-[var(--color-text-muted)] text-xs">to</span>
      <input
        type="date"
        className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-100)] px-2 py-1.5 text-sm text-[var(--color-text-secondary)] focus:outline-none"
        value={filters.dateTo || ''}
        onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value || undefined, page: 1 }))}
      />

      {/* Clear */}
      {Object.keys(filters).some(k => k !== 'page' && k !== 'limit' && k !== 'sortBy' && k !== 'sortDir' && filters[k]) && (
        <button
          onClick={() => setFilters({ page: 1, limit: 25, sortBy: 'entryDate', sortDir: 'desc' })}
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-loss-text)] transition-colors"
        >
          <X size={12} /> Clear
        </button>
      )}
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────

const COLS = [
  { key: 'entryDate', label: 'Date',      sortable: true  },
  { key: 'symbol',    label: 'Symbol',    sortable: true  },
  { key: 'direction', label: 'Direction', sortable: false },
  { key: 'entryPrice',label: 'Entry',     sortable: false },
  { key: 'exitPrice', label: 'Exit',      sortable: false },
  { key: 'quantity',  label: 'Qty',       sortable: false },
  { key: 'pnl',       label: 'P&L',       sortable: true  },
  { key: 'rMultiple', label: 'R-Mult',    sortable: true  },
  { key: 'status',    label: 'Status',    sortable: false },
  { key: 'executionGrade', label: 'Grade', sortable: false },
  { key: 'actions',   label: '',          sortable: false },
];

export default function TradesPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const trades     = useSelector(selectTrades);
  const pagination = useSelector(selectTradesPagination);
  const status     = useSelector(selectTradesStatus);
  const accounts   = useSelector(selectAccounts);

  // Filters synced to URL
  const [filters, setFilters] = useState({
    page: Number(searchParams.get('page')) || 1,
    limit: 25,
    sortBy: searchParams.get('sortBy') || 'entryDate',
    sortDir: searchParams.get('sortDir') || 'desc',
    symbol: searchParams.get('symbol') || undefined,
    accountId: searchParams.get('accountId') || undefined,
    status: searchParams.get('status') || undefined,
    direction: searchParams.get('direction') || undefined,
    dateFrom: searchParams.get('dateFrom') || undefined,
    dateTo: searchParams.get('dateTo') || undefined,
  });

  const [selected, setSelected]       = useState(new Set());
  const [showForm, setShowForm]       = useState(false);
  const [editTrade, setEditTrade]     = useState(null);
  const [showImport, setShowImport]   = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Sync filters → URL
  useEffect(() => {
    const params = {};
    Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') params[k] = v; });
    setSearchParams(params, { replace: true });
  }, [filters]);

  // Fetch whenever filters change
  useEffect(() => {
    dispatch(fetchTrades(filters));
  }, [dispatch, JSON.stringify(filters)]);

  // Load accounts once
  useEffect(() => {
    if (accounts.length === 0) dispatch(fetchAccounts());
  }, []);

  // Handle duplicate-trade navigation state from TradeDetailPage.
  // Strip server-generated fields so TradeFormModal opens in "new trade" mode.
  useEffect(() => {
    const dup = location.state?.duplicate;
    if (!dup) return;
    const { _id, pnl, rMultiple, createdAt, updatedAt, __v, userId, externalId, ...rest } = dup;
    setEditTrade(rest);   // initialData without _id → TradeFormModal treats as new trade
    setShowForm(true);
    window.history.replaceState({}, ''); // clear state so refresh doesn't re-open
  }, []);

  // PWA shortcut: /app/trades?new=1 auto-opens the New Trade modal
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setEditTrade(null);
      setShowForm(true);
      // Clean the URL without a re-render loop
      setSearchParams(p => { p.delete('new'); return p; }, { replace: true });
    }
  }, []);


  const toggleSort = (key) => {
    setFilters(f => ({
      ...f,
      sortBy: key,
      sortDir: f.sortBy === key && f.sortDir === 'desc' ? 'asc' : 'desc',
      page: 1,
    }));
  };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(prev => prev.size === trades.length ? new Set() : new Set(trades.map(t => t._id)));
  };

  const handleDelete = async (id) => {
    await dispatch(deleteTrade(id)).unwrap();
    dispatch(addToast({ message: 'Trade deleted.', type: 'success' }));
    setDeleteConfirm(null);
  };

  const handleBulkDelete = async () => {
    await dispatch(bulkDeleteTrades([...selected])).unwrap();
    dispatch(addToast({ message: `${selected.size} trade(s) deleted.`, type: 'success' }));
    setSelected(new Set());
  };

  const handleExport = async () => {
    try {
      const res = await apiExportTrades(filters);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const a = document.createElement('a'); a.href = url; a.download = 'tradiary-export.csv'; a.click();
      URL.revokeObjectURL(url);
    } catch {
      dispatch(addToast({ message: 'Export failed.', type: 'error' }));
    }
  };

  const isLoading = status === 'loading';

  return (
    <div className="space-y-4">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Trades</h1>
          <p className="text-sm text-[var(--color-text-muted)]">{pagination.total} total trades</p>
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--color-loss)] bg-[var(--color-loss-subtle)] px-3 py-2 text-sm font-medium text-[var(--color-loss-text)] hover:bg-[var(--color-loss)]/20 transition-colors"
            >
              <Trash2 size={14} /> Delete {selected.size}
            </button>
          )}
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-100)] px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] transition-colors"
          >
            <Upload size={14} /> Import CSV
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-100)] px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] transition-colors"
          >
            <Download size={14} /> Export CSV
          </button>
          <button
            onClick={() => { setEditTrade(null); setShowForm(true); }}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-brand-muted)] transition-colors shadow-sm"
          >
            <Plus size={16} /> Log Trade
          </button>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="card py-3">
        <FilterBar filters={filters} setFilters={setFilters} accounts={accounts} />
      </div>

      {/* ── Table ── */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-100)]">
                <th className="px-4 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    className="rounded border-[var(--color-border)] accent-[var(--color-brand)]"
                    checked={selected.size === trades.length && trades.length > 0}
                    onChange={toggleAll}
                  />
                </th>
                {COLS.map(col => (
                  <th key={col.key}
                    className={`px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide whitespace-nowrap
                      ${col.sortable ? 'cursor-pointer hover:text-[var(--color-text-primary)] select-none' : ''}`}
                    onClick={() => col.sortable && toggleSort(col.key)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {col.sortable && <SortIcon field={col.key} sortBy={filters.sortBy} sortDir={filters.sortDir} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--color-border)]">
                    <td colSpan={COLS.length + 1} className="px-4 py-3">
                      <div className="skeleton h-4 w-full rounded" />
                    </td>
                  </tr>
                ))
              )}
              {!isLoading && trades.length === 0 && (
                <tr>
                  <td colSpan={COLS.length + 1} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="rounded-full bg-[var(--color-surface-200)] p-4">
                        <Filter size={24} className="text-[var(--color-text-muted)]" />
                      </div>
                      <p className="text-sm font-medium text-[var(--color-text-secondary)]">No trades found</p>
                      <p className="text-xs text-[var(--color-text-muted)]">Try adjusting your filters or log your first trade</p>
                      <button
                        onClick={() => { setEditTrade(null); setShowForm(true); }}
                        className="mt-1 rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-brand-muted)] transition-colors"
                      >
                        Log your first trade
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              {!isLoading && trades.map((trade) => (
                <tr
                  key={trade._id}
                  className={`border-b border-[var(--color-border)] hover:bg-[var(--color-surface-100)] transition-colors cursor-pointer ${rowStripe(trade)}`}
                  onClick={() => navigate(`/app/trades/${trade._id}`)}
                >
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="rounded border-[var(--color-border)] accent-[var(--color-brand)]"
                      checked={selected.has(trade._id)}
                      onChange={() => toggleSelect(trade._id)}
                    />
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--color-text-muted)] whitespace-nowrap font-num">
                    {formatDate(trade.entryDate)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-[var(--color-text-primary)]">{trade.symbol}</span>
                      <SourceBadge source={trade.source} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={trade.direction}>{trade.direction}</Badge>
                  </td>
                  <td className="px-4 py-3 font-num text-[var(--color-text-secondary)]">{fmt(trade.entryPrice, 4)}</td>
                  <td className="px-4 py-3 font-num text-[var(--color-text-secondary)]">
                    {trade.exitPrice ? fmt(trade.exitPrice, 4) : <span className="text-[var(--color-text-muted)]">—</span>}
                  </td>
                  <td className="px-4 py-3 font-num text-[var(--color-text-secondary)]">{fmt(trade.quantity, 0)}</td>
                  <td className="px-4 py-3"><PnlCell value={trade.pnl} /></td>
                  <td className="px-4 py-3">
                    {trade.rMultiple != null
                      ? <span className={`font-num text-xs font-semibold ${trade.rMultiple >= 0 ? 'text-[var(--color-gain-text)]' : 'text-[var(--color-loss-text)]'}`}>
                          {trade.rMultiple >= 0 ? '+' : ''}{trade.rMultiple.toFixed(2)}R
                        </span>
                      : <span className="text-[var(--color-text-muted)]">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={trade.status}>{trade.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {trade.executionGrade
                      ? <Badge variant={trade.executionGrade}>{trade.executionGrade}</Badge>
                      : <span className="text-[var(--color-text-muted)]">—</span>}
                  </td>
                  {/* Actions */}
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 hover:opacity-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Duplicate: strip server fields so modal opens as a new trade
                          const { _id, pnl, rMultiple, createdAt, updatedAt, __v, userId, externalId, ...rest } = trade;
                          setEditTrade(rest);
                          setShowForm(true);
                        }}
                        className="rounded p-1 text-[var(--color-text-muted)] hover:text-[var(--color-brand)] hover:bg-[var(--color-brand-subtle)] transition-colors"
                        title="Duplicate trade"
                        aria-label={`Duplicate ${trade.symbol}`}
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditTrade(trade); setShowForm(true); }}
                        className="rounded p-1 text-[var(--color-text-muted)] hover:text-[var(--color-brand)] hover:bg-[var(--color-brand-subtle)] transition-colors"
                        title="Edit"
                      >
                        <MoreHorizontal size={14} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirm(trade._id); }}
                        className="rounded p-1 text-[var(--color-text-muted)] hover:text-[var(--color-loss-text)] hover:bg-[var(--color-loss-subtle)] transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between border-t border-[var(--color-border)] px-4 py-3">
            <p className="text-xs text-[var(--color-text-muted)]">
              Page {pagination.page} of {pagination.pages} ({pagination.total} trades)
            </p>
            <div className="flex gap-1">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setFilters(f => ({ ...f, page: p }))}
                  className={`h-7 w-7 rounded text-xs font-medium transition-colors
                    ${p === pagination.page
                      ? 'bg-[var(--color-brand)] text-white'
                      : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-200)]'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Delete confirm dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="card w-full max-w-sm">
            <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">Delete this trade?</p>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">This action cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-100)]">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="rounded-lg bg-[var(--color-loss)] px-4 py-2 text-sm font-medium text-white hover:opacity-90">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Trade form modal */}
      <TradeFormModal
        open={showForm}
        onClose={() => { setShowForm(false); setEditTrade(null); }}
        initialData={editTrade}
        defaultAccountId={accounts[0]?._id}
        onSaved={() => dispatch(fetchTrades(filters))}
      />

      {/* CSV import modal */}
      <CsvImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
        accounts={accounts}
        onImported={() => { dispatch(fetchTrades(filters)); setShowImport(false); }}
      />
    </div>
  );
}
