/**
 * components/trades/TradeReplayTab.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Professional Trade Replay panel.
 *
 * Features
 * ─────────
 * • Timeframe switcher (1m 5m 15m 30m 1h 1d) — grayed-out when data age
 *   makes a TF unavailable from Yahoo Finance
 * • Full context window: 50 candles before entry, 20 after exit
 * • lightweight-charts v5 candlestick chart (addSeries / CandlestickSeries)
 * • Dashed SL (red) and TP (green) price lines with axis labels
 * • Entry (▲ blue) and Exit (▼ cyan) arrow markers via createSeriesMarkers
 * • Vertical dashed line at entry and exit via createPriceLine trick
 * • Play / Pause button, 5 speed presets, scrubber slider
 * • "Jump to Entry" and "Jump to Exit" buttons
 * • Candle counter and % progress bar
 * • Graceful "Replay not available" state with reason and tips
 * • Loading skeleton
 * • Data attribution note (Yahoo Finance)
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  createChart,
  CandlestickSeries,
  CrosshairMode,
  LineStyle,
  createSeriesMarkers,
} from 'lightweight-charts';
import {
  Play, Pause, SkipBack, SkipForward,
  AlertTriangle, Film, Info,
} from 'lucide-react';
import { apiGetReplayData } from '@/api/trades';

// ─── Constants ────────────────────────────────────────────────────────────────

const SPEEDS = [
  { label: '0.5×', ms: 160 },
  { label: '1×',   ms: 80  },
  { label: '2×',   ms: 40  },
  { label: '4×',   ms: 20  },
  { label: '8×',   ms: 10  },
];

const TF_LABELS = ['1m', '5m', '15m', '30m', '1h', '1d'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isDark = () => document.documentElement.dataset.theme !== 'light';

// ─── Component ────────────────────────────────────────────────────────────────

export default function TradeReplayTab({ trade }) {
  // ── Data state ─────────────────────────────────────────────────────────────
  const [replayData,      setReplayData]      = useState(null);
  const [availableTfs,    setAvailableTfs]    = useState([]);
  const [selectedTf,      setSelectedTf]      = useState(null);  // null = auto
  const [loading,         setLoading]         = useState(true);
  const [unavailable,     setUnavailable]     = useState(null);

  // ── Playback state ─────────────────────────────────────────────────────────
  const [playing,         setPlaying]         = useState(false);
  const [speedIdx,        setSpeedIdx]        = useState(1);      // default 1×
  const [revealed,        setRevealed]        = useState(0);
  const [total,           setTotal]           = useState(0);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const containerRef   = useRef(null);
  const chartRef       = useRef(null);
  const seriesRef      = useRef(null);
  const markersRef     = useRef(null);
  const timerRef       = useRef(null);
  const revealedRef    = useRef(0);
  const replayDataRef  = useRef(null);   // always-current snapshot for timer

  // ── Stop playback ──────────────────────────────────────────────────────────
  const stopPlayback = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setPlaying(false);
  }, []);

  // ── Fetch replay data ──────────────────────────────────────────────────────
  const fetchData = useCallback(async (tf = null) => {
    if (!trade?._id) return;
    stopPlayback();
    setLoading(true);
    setUnavailable(null);
    setReplayData(null);
    setRevealed(0);
    revealedRef.current = 0;
    replayDataRef.current = null;

    try {
      const params = tf ? { timeframe: tf } : {};
      const res    = await apiGetReplayData(trade._id, params);
      const data   = res.data;

      if (data.availableTimeframes) setAvailableTfs(data.availableTimeframes);

      if (!data.available) {
        setUnavailable(data.reason || 'Replay not available for this trade.');
      } else {
        replayDataRef.current = data;
        setReplayData(data);
        setSelectedTf(data.timeframe);  // use actual resolved TF from server
        setTotal(data.candles.length);
        const start = data.entryIdx ?? 0;
        revealedRef.current = start + 1;
        setRevealed(start + 1);
      }
    } catch (err) {
      setUnavailable(err?.response?.data?.reason || err.message || 'Failed to load replay data.');
    } finally {
      setLoading(false);
    }
  }, [trade?._id, stopPlayback]);

  // ── Initial load ───────────────────────────────────────────────────────────
  useEffect(() => {
    fetchData(null);           // auto timeframe first time
    return () => stopPlayback();
  }, [trade?._id]);            // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handle TF button click ─────────────────────────────────────────────────
  const handleTfClick = (tf) => {
    if (tf === selectedTf) return;
    fetchData(tf);
  };

  // ── Build / rebuild chart when replayData changes ─────────────────────────
  useEffect(() => {
    if (!replayData || !containerRef.current) return;

    const dark = isDark();

    const chart = createChart(containerRef.current, {
      width:  containerRef.current.clientWidth,
      height: 480,
      layout: {
        background: { color: dark ? '#0F172A' : '#FFFFFF' },
        textColor:  dark ? '#94A3B8' : '#5B6784',
        fontSize:   11,
        fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
      },
      grid: {
        vertLines: { color: dark ? '#1E293B' : '#E8EEF6', style: LineStyle.Dotted },
        horzLines: { color: dark ? '#1E293B' : '#E8EEF6', style: LineStyle.Dotted },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: '#6366F1', labelBackgroundColor: '#6366F1', width: 1, style: LineStyle.Dashed },
        horzLine: { color: '#6366F1', labelBackgroundColor: '#6366F1', width: 1, style: LineStyle.Dashed },
      },
      rightPriceScale: {
        borderColor: dark ? '#1E293B' : '#E2E8F0',
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor:    dark ? '#1E293B' : '#E2E8F0',
        timeVisible:    true,
        secondsVisible: false,
        rightOffset:    5,
        fixLeftEdge:    false,
      },
    });

    // ── Candlestick series (v5 API) ──────────────────────────────────────────
    const series = chart.addSeries(CandlestickSeries, {
      upColor:         '#22C55E',
      downColor:       '#EF4444',
      borderUpColor:   '#22C55E',
      borderDownColor: '#EF4444',
      wickUpColor:     '#4ADE80',
      wickDownColor:   '#F87171',
    });

    // ── SL price line ────────────────────────────────────────────────────────
    if (replayData.markers.stopLoss != null) {
      series.createPriceLine({
        price:            replayData.markers.stopLoss,
        color:            '#EF4444',
        lineWidth:        1,
        lineStyle:        LineStyle.Dashed,
        axisLabelVisible: true,
        title:            '  SL',
      });
    }

    // ── TP price line ────────────────────────────────────────────────────────
    if (replayData.markers.takeProfit != null) {
      series.createPriceLine({
        price:            replayData.markers.takeProfit,
        color:            '#22C55E',
        lineWidth:        1,
        lineStyle:        LineStyle.Dashed,
        axisLabelVisible: true,
        title:            '  TP',
      });
    }

    // ── Entry / exit markers (v5 createSeriesMarkers) ─────────────────────────
    const markerDefs = [];
    if (replayData.markers.entry) {
      markerDefs.push({
        time:     replayData.markers.entry.time,
        position: 'belowBar',
        color:    '#6366F1',
        shape:    'arrowUp',
        text:     `Entry @ ${replayData.markers.entry.price}`,
        size:     1,
      });
    }
    if (replayData.markers.exit) {
      markerDefs.push({
        time:     replayData.markers.exit.time,
        position: 'aboveBar',
        color:    '#22D3EE',
        shape:    'arrowDown',
        text:     `Exit @ ${replayData.markers.exit.price}`,
        size:     1,
      });
    }
    const markersHandle = createSeriesMarkers(series, markerDefs);

    // ── Initial candle data ──────────────────────────────────────────────────
    const n = revealedRef.current;
    series.setData(replayData.candles.slice(0, n));
    chart.timeScale().fitContent();

    chartRef.current  = chart;
    seriesRef.current = series;
    markersRef.current = markersHandle;

    // ── Resize observer ──────────────────────────────────────────────────────
    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      try { markersHandle?.unsubscribeAll?.(); } catch (_) {}
      chart.remove();
      chartRef.current   = null;
      seriesRef.current  = null;
      markersRef.current = null;
    };
  }, [replayData]);

  // ── Playback engine ────────────────────────────────────────────────────────
  const startPlayback = useCallback(() => {
    const data = replayDataRef.current;
    if (!data || !seriesRef.current) return;

    // Rewind if at end
    if (revealedRef.current >= data.candles.length) {
      revealedRef.current = 1;
      setRevealed(1);
      seriesRef.current.setData(data.candles.slice(0, 1));
    }

    setPlaying(true);

    timerRef.current = setInterval(() => {
      const next = revealedRef.current + 1;
      if (next > data.candles.length) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        setPlaying(false);
        return;
      }
      revealedRef.current = next;
      setRevealed(next);
      seriesRef.current?.setData(data.candles.slice(0, next));
    }, SPEEDS[speedIdx].ms);
  }, [speedIdx]);

  // Restart at new speed if already playing
  useEffect(() => {
    if (playing) {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      const data = replayDataRef.current;
      if (!data || !seriesRef.current) return;
      timerRef.current = setInterval(() => {
        const next = revealedRef.current + 1;
        if (next > data.candles.length) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          setPlaying(false);
          return;
        }
        revealedRef.current = next;
        setRevealed(next);
        seriesRef.current?.setData(data.candles.slice(0, next));
      }, SPEEDS[speedIdx].ms);
    }
  }, [speedIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => stopPlayback(), [stopPlayback]);

  const handlePlayPause = () => { if (playing) stopPlayback(); else startPlayback(); };

  const handleScrub = (e) => {
    const val  = Number(e.target.value);
    const data = replayDataRef.current;
    stopPlayback();
    revealedRef.current = val;
    setRevealed(val);
    seriesRef.current?.setData(data?.candles.slice(0, val) ?? []);
  };

  const jumpTo = (idx) => {
    const data = replayDataRef.current;
    if (!data || !seriesRef.current) return;
    stopPlayback();
    const n = Math.min(idx + 1, data.candles.length);
    revealedRef.current = n;
    setRevealed(n);
    seriesRef.current.setData(data.candles.slice(0, n));
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const pct      = total > 0 ? (revealed / total) * 100 : 0;
  const entryIdx = replayData?.entryIdx ?? 0;
  const exitIdx  = replayData?.exitIdx  ?? total - 1;
  const atEnd    = revealed >= total;

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-3 mt-4">
        {/* Timeframe skeleton */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--color-text-muted)]">Timeframe</span>
          {TF_LABELS.map(tf => (
            <div key={tf} className="skeleton h-7 w-10 rounded-md" />
          ))}
        </div>
        <div className="skeleton h-[480px] w-full rounded-xl" />
        <div className="skeleton h-14 w-full rounded-xl" />
      </div>
    );
  }

  // ── Unavailable ────────────────────────────────────────────────────────────
  if (unavailable) {
    return (
      <div className="mt-4 space-y-3">
        {/* Still show TF buttons so user can try a different one */}
        {availableTfs.length > 0 && (
          <TfBar tfs={availableTfs} selected={selectedTf} onSelect={handleTfClick} />
        )}
        <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-100)] py-14 px-6 text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[var(--color-surface-200)] flex items-center justify-center">
            <Film size={28} className="text-[var(--color-text-muted)]" />
          </div>
          <div>
            <p className="text-base font-semibold text-[var(--color-text-primary)] mb-1">Replay not available</p>
            <p className="text-sm text-[var(--color-text-muted)] max-w-md leading-relaxed">{unavailable}</p>
          </div>
          <div className="flex items-start gap-1.5 text-xs text-amber-400 bg-amber-400/10 rounded-lg px-3 py-2 max-w-sm">
            <AlertTriangle size={13} className="mt-0.5 shrink-0" />
            <span>
              Yahoo Finance intraday data: 1m candles are only available for the last 7 days;
              5m / 15m / 30m for the last 60 days. For older trades try switching to <strong>1h</strong> or <strong>1d</strong>.
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (!replayData) return null;

  // ── Main chart UI ──────────────────────────────────────────────────────────
  return (
    <div className="mt-4 space-y-3">

      {/* ── Header row: TF switcher + legend ─────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <TfBar tfs={availableTfs} selected={selectedTf} onSelect={handleTfClick} />

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[10px] text-[var(--color-text-muted)]">
          {replayData.markers.stopLoss != null && (
            <span className="flex items-center gap-1">
              <DashedLine color="#EF4444" /> SL
            </span>
          )}
          {replayData.markers.takeProfit != null && (
            <span className="flex items-center gap-1">
              <DashedLine color="#22C55E" /> TP
            </span>
          )}
          <span className="flex items-center gap-1">
            <span style={{ color: '#6366F1', fontSize: 12, lineHeight: 1 }}>▲</span> Entry
          </span>
          <span className="flex items-center gap-1">
            <span style={{ color: '#22D3EE', fontSize: 12, lineHeight: 1 }}>▼</span> Exit
          </span>
          <span className="font-num text-[var(--color-text-muted)]">
            {replayData.candles.length} candles
          </span>
        </div>
      </div>

      {/* ── Chart ─────────────────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="w-full rounded-xl overflow-hidden border border-[var(--color-border)]"
        style={{ minHeight: 480 }}
      />

      {/* ── Playback controls ─────────────────────────────────────────────── */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-100)] px-4 py-3 space-y-2">

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-num text-[var(--color-text-muted)] w-10 text-right shrink-0 tabular-nums">
            {revealed}
          </span>
          <input
            id="replay-scrubber"
            type="range"
            min={1}
            max={total || 1}
            value={revealed}
            onChange={handleScrub}
            className="flex-1 h-1.5 cursor-pointer"
            style={{ accentColor: '#6366F1' }}
          />
          <span className="text-[11px] font-num text-[var(--color-text-muted)] w-10 shrink-0 tabular-nums">
            {total}
          </span>
        </div>

        {/* Filled progress strip */}
        <div className="h-0.5 rounded-full overflow-hidden bg-[var(--color-surface-200)]">
          <div
            className="h-full rounded-full transition-[width] duration-75"
            style={{
              width:      `${pct}%`,
              background: 'linear-gradient(90deg, #6366F1, #22D3EE)',
            }}
          />
        </div>

        {/* Buttons row */}
        <div className="flex flex-wrap items-center gap-2 pt-0.5">

          {/* Play / Pause */}
          <button
            id="replay-play-pause"
            onClick={handlePlayPause}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--color-brand)] px-4 py-1.5 text-sm font-semibold text-white hover:opacity-90 active:scale-95 transition-all"
          >
            {playing
              ? <><Pause size={14} /> Pause</>
              : <><Play  size={14} /> {atEnd ? 'Replay' : (revealed <= 1 ? 'Play' : 'Resume')}</>
            }
          </button>

          {/* Speed selector */}
          <div className="flex items-center rounded-lg border border-[var(--color-border)] overflow-hidden">
            {SPEEDS.map((s, i) => (
              <button
                key={s.label}
                id={`replay-speed-${s.label.replace('×', 'x')}`}
                onClick={() => setSpeedIdx(i)}
                className={[
                  'px-2.5 py-1.5 text-xs font-medium transition-colors',
                  speedIdx === i
                    ? 'bg-[var(--color-brand)] text-white'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-200)]',
                ].join(' ')}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          {/* Jump buttons */}
          <button
            id="replay-jump-entry"
            onClick={() => jumpTo(entryIdx)}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--color-surface-200)] transition-colors"
            style={{ color: '#6366F1' }}
          >
            <SkipBack size={13} /> Entry
          </button>
          <button
            id="replay-jump-exit"
            onClick={() => jumpTo(exitIdx)}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--color-surface-200)] transition-colors"
            style={{ color: '#22D3EE' }}
          >
            Exit <SkipForward size={13} />
          </button>
        </div>
      </div>

      {/* ── Attribution note ──────────────────────────────────────────────── */}
      <div className="flex items-start gap-1.5 text-[10px] text-[var(--color-text-muted)] opacity-70">
        <Info size={11} className="mt-0.5 shrink-0" />
        <span>
          Chart data from Yahoo Finance. Prices are interbank mid-rates and may differ slightly from broker-specific pricing.
          Spot metals use <code className="text-[10px]">XAUUSD=X</code> / <code className="text-[10px]">XAGUSD=X</code>.
        </span>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** TradingView-style timeframe button bar */
function TfBar({ tfs, selected, onSelect }) {
  if (!tfs?.length) {
    // Render placeholders while we don't have TF data yet
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-[var(--color-text-muted)] mr-1">Timeframe</span>
        {TF_LABELS.map(tf => (
          <button key={tf} disabled className="px-2 py-1 rounded text-xs font-medium text-[var(--color-text-muted)] bg-[var(--color-surface-200)] opacity-50">{tf}</button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-[var(--color-text-muted)] mr-1">Timeframe</span>
      {tfs.map(({ value, label, available }) => {
        const isActive = value === selected;
        return (
          <button
            key={value}
            id={`replay-tf-${value}`}
            onClick={() => available && onSelect(value)}
            disabled={!available}
            title={!available ? `${value} data not available (too old for Yahoo Finance intraday)` : undefined}
            className={[
              'px-2.5 py-1 rounded text-xs font-semibold transition-all',
              isActive
                ? 'bg-[var(--color-brand)] text-white shadow-sm'
                : available
                  ? 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-200)] hover:text-[var(--color-text-primary)]'
                  : 'text-[var(--color-text-muted)] opacity-40 cursor-not-allowed line-through',
            ].join(' ')}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

/** Tiny SVG dashed line for the legend */
function DashedLine({ color }) {
  return (
    <svg width="22" height="6">
      <line x1="0" y1="3" x2="22" y2="3" stroke={color} strokeWidth="1.5" strokeDasharray="4 2" />
    </svg>
  );
}
