/**
 * components/trades/CsvImportModal.jsx
 * 3-step CSV import: Upload → Column Mapping → Preview & Confirm
 */
import React, { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { Upload, AlertCircle, CheckCircle, X } from 'lucide-react';
import { apiImportTrades } from '@/api/trades';
import { addToast } from '@/features/ui/toastSlice';
import Modal from '@/components/ui/Modal';

const TRADE_FIELDS = [
  { value: '', label: '— skip —' },
  { value: 'symbol',         label: 'Symbol' },
  { value: 'assetClass',     label: 'Asset Class' },
  { value: 'direction',      label: 'Direction (long/short)' },
  { value: 'status',         label: 'Status (open/closed)' },
  { value: 'entryDate',      label: 'Entry Date' },
  { value: 'exitDate',       label: 'Exit Date' },
  { value: 'entryPrice',     label: 'Entry Price' },
  { value: 'exitPrice',      label: 'Exit Price' },
  { value: 'quantity',       label: 'Quantity' },
  { value: 'stopLoss',       label: 'Stop Loss' },
  { value: 'takeProfit',     label: 'Take Profit' },
  { value: 'fees',           label: 'Fees' },
  { value: 'tags',           label: 'Tags (semicolon-separated)' },
  { value: 'emotion',        label: 'Emotion' },
  { value: 'executionGrade', label: 'Execution Grade' },
  { value: 'notes',          label: 'Notes' },
];

// Auto-map common broker column names
const AUTO_MAP = {
  'symbol': 'symbol', 'ticker': 'symbol', 'instrument': 'symbol',
  'side': 'direction', 'direction': 'direction', 'type': 'direction',
  'entry': 'entryPrice', 'entry price': 'entryPrice', 'open price': 'entryPrice',
  'exit': 'exitPrice',  'exit price': 'exitPrice',  'close price': 'exitPrice',
  'qty': 'quantity', 'quantity': 'quantity', 'size': 'quantity', 'shares': 'quantity', 'lots': 'quantity',
  'entry date': 'entryDate', 'open date': 'entryDate', 'open time': 'entryDate', 'date': 'entryDate',
  'exit date': 'exitDate',   'close date': 'exitDate',  'close time': 'exitDate',
  'sl': 'stopLoss', 'stop loss': 'stopLoss', 'stop': 'stopLoss',
  'tp': 'takeProfit', 'take profit': 'takeProfit', 'target': 'takeProfit',
  'commission': 'fees', 'fee': 'fees', 'fees': 'fees',
  'p&l': 'pnl', 'pnl': 'pnl', 'profit': 'pnl',
  'notes': 'notes', 'comment': 'notes', 'comments': 'notes',
  'tags': 'tags',
};

function parseCsv(text) {
  const lines  = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  const parseRow = (line) => {
    const result = [];
    let cur = '', inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuote = !inQuote; }
      else if (ch === ',' && !inQuote) { result.push(cur); cur = ''; }
      else { cur += ch; }
    }
    result.push(cur);
    return result.map(v => v.trim().replace(/^"|"$/g, ''));
  };

  const headers = parseRow(lines[0]);
  const rows    = lines.slice(1).map(l => {
    const vals = parseRow(l);
    const obj  = {};
    headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
    return obj;
  });

  return { headers, rows };
}

const STEPS = ['Upload', 'Map Columns', 'Preview & Import'];

export default function CsvImportModal({ open, onClose, accounts, onImported }) {
  const dispatch = useDispatch();
  const [step, setStep]           = useState(0);
  const [parsed, setParsed]       = useState(null); // { headers, rows }
  const [columnMap, setColumnMap] = useState({});   // { csvHeader: tradeField }
  const [accountId, setAccountId] = useState(accounts[0]?._id || '');
  const [importing, setImporting] = useState(false);
  const [result, setResult]       = useState(null); // { created, failed }

  const reset = () => { setStep(0); setParsed(null); setColumnMap({}); setResult(null); };

  const handleFile = useCallback((file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const { headers, rows } = parseCsv(e.target.result);
      // Auto-map columns
      const map = {};
      headers.forEach(h => { map[h] = AUTO_MAP[h.toLowerCase()] || ''; });
      setColumnMap(map);
      setParsed({ headers, rows });
      setStep(1);
    };
    reader.readAsText(file);
  }, []);

  const handleImport = async () => {
    if (!accountId) return;
    setImporting(true);
    try {
      const res = await apiImportTrades({
        rows:      parsed.rows,
        accountId,
        columnMap: Object.fromEntries(Object.entries(columnMap).filter(([, v]) => v)),
      });
      setResult(res.data.data);
      setStep(2);
      if (res.data.data.created > 0) {
        dispatch(addToast({ message: `${res.data.data.created} trade(s) imported!`, type: 'success' }));
        onImported?.();
      }
    } catch (err) {
      dispatch(addToast({ message: err.response?.data?.error?.message || 'Import failed.', type: 'error' }));
    } finally {
      setImporting(false);
    }
  };

  const previewRows = parsed?.rows.slice(0, 5) || [];
  const mappedFields = Object.entries(columnMap).filter(([, v]) => v);

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose(); }}
      title="Import Trades from CSV"
      size="lg"
    >
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6 -mx-6 px-6 pb-4 border-b border-[var(--color-border)]">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-2 text-xs font-medium ${i === step ? 'text-[var(--color-brand)]' : i < step ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-text-muted)]'}`}>
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold
                ${i < step ? 'bg-[var(--color-gain-subtle)] text-[var(--color-gain-text)]' : i === step ? 'bg-[var(--color-brand)] text-white' : 'bg-[var(--color-surface-200)] text-[var(--color-text-muted)]'}`}>
                {i < step ? '✓' : i + 1}
              </span>
              {s}
            </div>
            {i < STEPS.length - 1 && <div className="flex-1 h-px bg-[var(--color-border)]" />}
          </React.Fragment>
        ))}
      </div>

      {/* ── Step 0: Upload ── */}
      {step === 0 && (
        <div className="space-y-4">
          <div className="mb-3">
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Account to import into</label>
            <select
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-100)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-brand)]"
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
            >
              {accounts.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
            </select>
          </div>
          <label
            className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface-100)] p-12 cursor-pointer hover:border-[var(--color-brand)] transition-colors"
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
          >
            <Upload size={32} className="text-[var(--color-text-muted)]" />
            <div className="text-center">
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">Drop your CSV file here</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">or click to browse — any broker CSV format</p>
            </div>
            <input type="file" accept=".csv" className="hidden" onChange={e => handleFile(e.target.files[0])} />
          </label>
          <p className="text-xs text-[var(--color-text-muted)]">
            You'll map your CSV columns to Tradiary fields in the next step. Any broker format works.
          </p>
        </div>
      )}

      {/* ── Step 1: Column mapping ── */}
      {step === 1 && parsed && (
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Found <strong>{parsed.headers.length}</strong> columns and <strong>{parsed.rows.length}</strong> rows. Map each CSV column to a trade field:
          </p>
          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
            {parsed.headers.map(h => (
              <div key={h} className="grid grid-cols-2 gap-3 items-center">
                <div className="rounded-lg bg-[var(--color-surface-200)] px-3 py-1.5 text-xs font-mono text-[var(--color-text-secondary)] truncate">
                  {h}
                </div>
                <select
                  className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-100)] px-2 py-1.5 text-xs focus:outline-none focus:border-[var(--color-brand)]"
                  value={columnMap[h] || ''}
                  onChange={e => setColumnMap(prev => ({ ...prev, [h]: e.target.value }))}
                >
                  {TRADE_FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
            ))}
          </div>

          {/* Preview first 5 rows */}
          {previewRows.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2">Preview (first {previewRows.length} rows)</p>
              <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
                <table className="text-xs w-full">
                  <thead className="bg-[var(--color-surface-100)]">
                    <tr>
                      {mappedFields.map(([h, f]) => (
                        <th key={h} className="px-2 py-1.5 text-left font-semibold text-[var(--color-text-muted)] whitespace-nowrap">{f}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={i} className="border-t border-[var(--color-border)]">
                        {mappedFields.map(([h]) => (
                          <td key={h} className="px-2 py-1.5 text-[var(--color-text-secondary)] whitespace-nowrap max-w-[120px] truncate">
                            {row[h] || <span className="text-[var(--color-text-muted)]">—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-2">
            <button onClick={() => setStep(0)} className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">← Back</button>
            <button
              onClick={handleImport}
              disabled={importing || mappedFields.length === 0}
              className="rounded-lg bg-[var(--color-brand)] px-5 py-2 text-sm font-medium text-white hover:bg-[var(--color-brand-muted)] disabled:opacity-50 transition-colors"
            >
              {importing ? 'Importing…' : `Import ${parsed.rows.length} rows →`}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Result ── */}
      {step === 2 && result && (
        <div className="space-y-4 text-center py-4">
          <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${result.created > 0 ? 'bg-[var(--color-gain-subtle)]' : 'bg-[var(--color-loss-subtle)]'}`}>
            {result.created > 0
              ? <CheckCircle size={32} className="text-[var(--color-gain-text)]" />
              : <AlertCircle size={32} className="text-[var(--color-loss-text)]" />}
          </div>
          <div>
            <p className="text-lg font-bold text-[var(--color-text-primary)]">Import complete</p>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              <span className="text-[var(--color-gain-text)] font-semibold">{result.created} imported</span>
              {result.failed?.length > 0 && <span> · <span className="text-[var(--color-loss-text)] font-semibold">{result.failed.length} failed</span></span>}
            </p>
          </div>

          {result.failed?.length > 0 && (
            <div className="text-left rounded-lg border border-[var(--color-loss)]/30 bg-[var(--color-loss-subtle)] p-3 max-h-40 overflow-y-auto">
              <p className="text-xs font-semibold text-[var(--color-loss-text)] mb-2">Failed rows:</p>
              {result.failed.map((f, i) => (
                <p key={i} className="text-xs text-[var(--color-text-secondary)]">Row {f.row}: {f.reason}</p>
              ))}
            </div>
          )}

          <button
            onClick={() => { reset(); onClose(); }}
            className="rounded-lg bg-[var(--color-brand)] px-6 py-2 text-sm font-medium text-white hover:bg-[var(--color-brand-muted)] transition-colors"
          >
            Done
          </button>
        </div>
      )}
    </Modal>
  );
}
