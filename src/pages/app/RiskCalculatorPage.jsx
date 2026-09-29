/**
 * pages/app/RiskCalculatorPage.jsx
 * Pure client-side position sizing + R-multiple calculator.
 * No save to server required.
 */
import React, { useState, useMemo } from 'react';
import { Calculator, ArrowRight, Info } from 'lucide-react';

const fmt = (n, d = 2) => n == null || isNaN(n) ? '—' : n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const clamp = (n) => (isFinite(n) && n > 0) ? n : null;

function ResultRow({ label, value, sub, highlight }) {
  return (
    <div className={`flex items-center justify-between rounded-xl border px-4 py-3 ${highlight ? 'border-[var(--color-brand)] bg-[var(--color-brand-subtle)]' : 'border-[var(--color-border)] bg-[var(--color-surface-100)]'}`}>
      <div>
        <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
        {sub && <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{sub}</p>}
      </div>
      <p className={`text-lg font-bold font-num ${highlight ? 'text-[var(--color-brand)]' : 'text-[var(--color-text-primary)]'}`}>{value}</p>
    </div>
  );
}

function NumInput({ label, value, onChange, placeholder, prefix, suffix, hint }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">{label}</label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--color-text-muted)]">{prefix}</span>}
        <input
          type="number" value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-100)] py-2 text-sm focus:outline-none focus:border-[var(--color-brand)] ${prefix ? 'pl-7 pr-3' : suffix ? 'pl-3 pr-7' : 'px-3'}`}
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--color-text-muted)]">{suffix}</span>}
      </div>
      {hint && <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{hint}</p>}
    </div>
  );
}

export default function RiskCalculatorPage() {
  // Position size calculator
  const [balance,    setBalance]    = useState('10000');
  const [riskPct,    setRiskPct]    = useState('1');
  const [entry,      setEntry]      = useState('');
  const [stopLoss,   setStopLoss]   = useState('');
  const [takeProfit, setTakeProfit] = useState('');

  // R-multiple calculator
  const [rEntry,  setREntry]  = useState('');
  const [rStop,   setRStop]   = useState('');
  const [rExit,   setRExit]   = useState('');

  // ─── Position sizing calculations ──────────────────────────────────────────

  const ps = useMemo(() => {
    const b   = parseFloat(balance);
    const rp  = parseFloat(riskPct);
    const ep  = parseFloat(entry);
    const sl  = parseFloat(stopLoss);
    const tp  = parseFloat(takeProfit);

    if (!b || !rp || !ep || !sl) return null;

    const dollarRisk    = b * (rp / 100);
    const stopDistance  = Math.abs(ep - sl);
    if (stopDistance === 0) return null;

    const positionSize  = dollarRisk / stopDistance;
    const positionValue = positionSize * ep;

    let rrRatio = null;
    let potentialProfit = null;
    if (tp) {
      const rewardDistance = Math.abs(tp - ep);
      rrRatio = rewardDistance / stopDistance;
      potentialProfit = rewardDistance * positionSize;
    }

    return {
      dollarRisk:     +dollarRisk.toFixed(2),
      stopDistance:   +stopDistance.toFixed(4),
      positionSize:   +positionSize.toFixed(4),
      positionValue:  +positionValue.toFixed(2),
      rrRatio:        rrRatio ? +rrRatio.toFixed(2) : null,
      potentialProfit: potentialProfit ? +potentialProfit.toFixed(2) : null,
    };
  }, [balance, riskPct, entry, stopLoss, takeProfit]);

  // ─── R-multiple calculation ────────────────────────────────────────────────

  const rMultiple = useMemo(() => {
    const ep = parseFloat(rEntry);
    const sl = parseFloat(rStop);
    const ex = parseFloat(rExit);
    if (!ep || !sl || !ex) return null;

    const riskPerUnit   = Math.abs(ep - sl);
    if (riskPerUnit === 0) return null;

    const pnlPerUnit    = ex - ep;
    return +(pnlPerUnit / riskPerUnit).toFixed(3);
  }, [rEntry, rStop, rExit]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Risk Calculator</h1>
        <p className="text-sm text-[var(--color-text-muted)]">Position sizing and R-multiple utilities — purely client-side, no data saved</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Position Size Calculator ── */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Calculator size={18} className="text-[var(--color-brand)]" />
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Position Size</h2>
          </div>

          <NumInput label="Account Balance" value={balance} onChange={setBalance} prefix="$" placeholder="10000" />
          <NumInput label="Risk per Trade" value={riskPct} onChange={setRiskPct} suffix="%" placeholder="1"
            hint="Percentage of account to risk on this trade" />
          <NumInput label="Entry Price" value={entry} onChange={setEntry} prefix="$" placeholder="150.00" />
          <NumInput label="Stop Loss" value={stopLoss} onChange={setStopLoss} prefix="$" placeholder="148.00" />
          <NumInput label="Take Profit (optional)" value={takeProfit} onChange={setTakeProfit} prefix="$" placeholder="156.00" />

          {/* Results */}
          <div className="space-y-2 pt-2 border-t border-[var(--color-border)]">
            {!ps ? (
              <p className="text-sm text-[var(--color-text-muted)] text-center py-4">
                Fill in balance, risk %, entry and stop loss to see results
              </p>
            ) : (
              <>
                <ResultRow label="Dollar Risk" value={`$${fmt(ps.dollarRisk)}`} sub={`${riskPct}% of $${fmt(parseFloat(balance), 0)}`} />
                <ResultRow label="Stop Distance" value={fmt(ps.stopDistance, 4)} sub="Price units between entry and stop" />
                <ResultRow label="Position Size" value={fmt(ps.positionSize, 2)} sub="Units / shares / contracts" highlight />
                <ResultRow label="Position Value" value={`$${fmt(ps.positionValue)}`} sub="Total capital deployed" />
                {ps.rrRatio != null && (
                  <>
                    <ResultRow label="R:R Ratio" value={`${fmt(ps.rrRatio, 2)}:1`} sub="Reward to risk ratio" highlight />
                    <ResultRow label="Potential Profit" value={`$${fmt(ps.potentialProfit)}`} sub="If TP is hit" />
                  </>
                )}
              </>
            )}
          </div>

          {/* Verification example */}
          <div className="rounded-lg bg-[var(--color-surface-200)] px-3 py-2 text-xs text-[var(--color-text-muted)]">
            <p className="font-semibold mb-1 text-[var(--color-text-secondary)]">Quick check:</p>
            <p>$10,000 × 1% risk ÷ $2 stop distance = <strong>50 units</strong></p>
          </div>
        </div>

        {/* ── R-Multiple Calculator ── */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowRight size={18} className="text-[var(--color-brand)]" />
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">R-Multiple</h2>
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">
            Calculate the R-multiple of any historical or planned trade. Useful for reviewing trades without needing full P&L in dollars.
          </p>

          <NumInput label="Entry Price" value={rEntry} onChange={setREntry} prefix="$" placeholder="150.00" />
          <NumInput label="Stop Loss" value={rStop} onChange={setRStop} prefix="$" placeholder="148.00" />
          <NumInput label="Exit Price" value={rExit} onChange={setRExit} prefix="$" placeholder="156.00" />

          {/* Result */}
          <div className="pt-2 border-t border-[var(--color-border)]">
            {rMultiple == null ? (
              <p className="text-sm text-[var(--color-text-muted)] text-center py-8">
                Enter entry, stop loss, and exit to calculate R-multiple
              </p>
            ) : (
              <div className="text-center py-6">
                <p className="text-xs text-[var(--color-text-muted)] mb-2">R-Multiple</p>
                <p className={`text-5xl font-bold font-num ${rMultiple >= 0 ? 'text-[var(--color-gain-text)]' : 'text-[var(--color-loss-text)]'}`}>
                  {rMultiple >= 0 ? '+' : ''}{fmt(rMultiple, 2)}R
                </p>
                <p className="text-xs text-[var(--color-text-muted)] mt-3">
                  {rMultiple >= 2 ? '🏆 Excellent — exceeds 2R target'
                    : rMultiple >= 1 ? '✅ Good — profitable trade'
                    : rMultiple >= 0 ? '⚠️ Marginal — less than 1R gain'
                    : rMultiple >= -1 ? '❌ Loss within 1R'
                    : '🚨 Large loss — exceeded 1R risk'}
                </p>
                <div className="mt-4 text-left rounded-lg bg-[var(--color-surface-200)] px-3 py-2 text-xs text-[var(--color-text-muted)]">
                  <p>Risk per unit: ${fmt(Math.abs(parseFloat(rEntry) - parseFloat(rStop)), 4)}</p>
                  <p>P&L per unit: ${fmt(parseFloat(rExit) - parseFloat(rEntry), 4)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info panel */}
      <div className="card bg-[var(--color-brand-subtle)] border-[var(--color-brand)]/30">
        <div className="flex items-start gap-3">
          <Info size={16} className="text-[var(--color-brand)] shrink-0 mt-0.5" />
          <div className="text-xs text-[var(--color-text-secondary)] space-y-1">
            <p><strong>Position Size Formula:</strong> (Account Balance × Risk%) ÷ Stop Distance</p>
            <p><strong>R-Multiple Formula:</strong> (Exit − Entry) ÷ |Entry − Stop|</p>
            <p className="text-[var(--color-text-muted)]">
              A positive R-multiple means the trade made more than the initial risk. 2R means you made 2× what you risked.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
