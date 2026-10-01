/**
 * components/trades/TradeReplayTab.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Replay tab for the Trade Detail page.
 * Uses TradingView lightweight-charts v5 for the candlestick chart.
 *
 * Features
 * ─────────
 * • Fetch replay-data from the API (candles + markers)
 * • Loading skeleton while fetching
 * • Graceful "not available" state (icon + reason)
 * • Candlestick chart with SL (dashed red) and TP (dashed green) price lines
 * • Entry marker (▲) and exit marker (▼) on the price series
 * • Playback controls: Play / Pause, speed selector, scrubber,
 *   "Jump to Entry" / "Jump to Exit" buttons
 * • Candle reveal by incrementally calling series.setData() on a timer
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  createChart,
  CrosshairMode,
  LineStyle,
  CandlestickSeries,
  createSeriesMarkers,
} from 'lightweight-charts';
import {
  Play, Pause, SkipBack, SkipForward,
  AlertTriangle, Film,
  TrendingUp, TrendingDown,
} from 'lucide-react';
import { apiGetReplayData } from '@/api/trades';

// ─── Constants ────────────────────────────────────────────────────────────────

const SPEEDS = [
  { label: '0.5×', value: 0.5 },
  { label: '1×',   value: 1   },
  { label: '2×',   value: 2   },
  { label: '4×',   value: 4   },
  { label: '8×',   value: 8   },
];

/** Base delay between revealed candles at 1× speed (ms) */
const BASE_INTERVAL_MS = 80;

// ─── Component ────────────────────────────────────────────────────────────────

export default function TradeReplayTab({ trade }) {
  const containerRef     = useRef(null);
  const chartRef         = useRef(null);
  const seriesRef        = useRef(null);
  const markersApiRef    = useRef(null);   // handle from createSeriesMarkers
  const timerRef         = useRef(null);
  const revealedRef      = useRef(0);      // shadow of `revealed` for use inside setInterval

  const [replayData, setReplayData] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [unavailable, setUnavailable] = useState(null); // reason string
  const [playing, setPlaying]       = useState(false);
  const [speed, setSpeed]           = useState(1);
  const [revealed, setRevealed]     = useState(0);
  const [total, setTotal]           = useState(0);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!trade?._id) return;
    setLoading(true);
    setUnavailable(null);
    setReplayData(null);
    setPlaying(false);
    setRevealed(0);
    revealedRef.current = 0;

    apiGetReplayData(trade._id)
      .then(res => {
        const data = res.data;
        if (!data.available) {
          setUnavailable(data.reason || 'Replay not available for this trade.');
        } else {
          setReplayData(data);
          setTotal(data.candles.length);
          setRevealed(1);
          revealedRef.current = 1;
        }
      })
      .catch(err => {
        const reason = err?.response?.data?.reason || err.message || 'Failed to load replay data.';
        setUnavailable(reason);
      })
      .finally(() => setLoading(false));
  }, [trade?._id]);

  // ── Build chart ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!replayData || !containerRef.current) return;

    const isLight = document.documentElement.dataset.theme === 'light';

    const chart = createChart(containerRef.current, {
      width:  containerRef.current.clientWidth,
      height: 420,
      layout: {
        background: { color: isLight ? '#FFFFFF' : '#111A2E' },
        textColor:  isLight ? '#5B6784' : '#8A97B2',
        fontSize:   11,
        fontFamily: "'Inter', system-ui, sans-serif",
      },
      grid: {
        vertLines: { color: isLight ? '#E2E8F3' : '#1E2A44', style: LineStyle.Dotted },
        horzLines: { color: isLight ? '#E2E8F3' : '#1E2A44', style: LineStyle.Dotted },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: '#5B6CFF', labelBackgroundColor: '#5B6CFF' },
        horzLine: { color: '#5B6CFF', labelBackgroundColor: '#5B6CFF' },
      },
      rightPriceScale: { borderColor: isLight ? '#E2E8F3' : '#1E2A44' },
      timeScale: {
        borderColor:    isLight ? '#E2E8F3' : '#1E2A44',
        timeVisible:    true,
        secondsVisible: false,
      },
    });

    // v5: chart.addSeries(SeriesType, options)
    const series = chart.addSeries(CandlestickSeries, {
      upColor:         '#22C55E',
      downColor:       '#EF4444',
      borderUpColor:   '#22C55E',
      borderDownColor: '#EF4444',
      wickUpColor:     '#22C55E',
      wickDownColor:   '#EF4444',
    });

    // SL price line
    if (replayData.markers.stopLoss != null) {
      series.createPriceLine({
        price:            replayData.markers.stopLoss,
        color:            '#EF4444',
        lineWidth:        1,
        lineStyle:        LineStyle.Dashed,
        axisLabelVisible: true,
        title:            'SL',
      });
    }

    // TP price line
    if (replayData.markers.takeProfit != null) {
      series.createPriceLine({
        price:            replayData.markers.takeProfit,
        color:            '#22C55E',
        lineWidth:        1,
        lineStyle:        LineStyle.Dashed,
        axisLabelVisible: true,
        title:            'TP',
      });
    }

    // v5: createSeriesMarkers(series, markersArray) returns a handle
    const markerDefs = [];
    if (replayData.markers.entry) {
      markerDefs.push({
        time:     replayData.markers.entry.time,
        position: 'belowBar',
        color:    '#5B6CFF',
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

    // Initial data (just 1st candle)
    series.setData(replayData.candles.slice(0, revealedRef.current));
    chart.timeScale().fitContent();

    chartRef.current      = chart;
    seriesRef.current     = series;
    markersApiRef.current = markersHandle;

    // Resize observer
    const ro = new ResizeObserver(() => {
      chart.applyOptions({ width: containerRef.current?.clientWidth ?? 800 });
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      if (markersHandle?.unsubscribeAll) markersHandle.unsubscribeAll();
      chart.remove();
      chartRef.current      = null;
      seriesRef.current     = null;
      markersApiRef.current = null;
    };
  }, [replayData]);

  // ── Playback engine ───────────────────────────────────────────────────────
  const stopPlayback = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setPlaying(false);
  }, []);

  const startPlayback = useCallback(() => {
    if (!replayData || !seriesRef.current) return;

    // Rewind if at the end
    if (revealedRef.current >= replayData.candles.length) {
      revealedRef.current = 1;
      setRevealed(1);
      seriesRef.current.setData(replayData.candles.slice(0, 1));
    }

    setPlaying(true);

    timerRef.current = setInterval(() => {
      const next = revealedRef.current + 1;
      if (next > replayData.candles.length) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        setPlaying(false);
        return;
      }
      revealedRef.current = next;
      setRevealed(next);
      seriesRef.current?.setData(replayData.candles.slice(0, next));
    }, Math.round(BASE_INTERVAL_MS / speed));
  }, [replayData, speed, stopPlayback]);

  // Re-start at new speed if already playing
  useEffect(() => {
    if (playing) {
      stopPlayback();
      // micro-delay so setPlaying(false) propagates before restart
      setTimeout(() => startPlayback(), 0);
    }
  }, [speed]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => stopPlayback(), [stopPlayback]);

  const handlePlayPause = () => {
    if (playing) stopPlayback();
    else         startPlayback();
  };

  const handleScrub = (e) => {
    const val = Number(e.target.value);
    stopPlayback();
    revealedRef.current = val;
    setRevealed(val);
    seriesRef.current?.setData(replayData.candles.slice(0, val));
  };

  const jumpTo = (targetTime) => {
    if (!replayData || !seriesRef.current) return;
    stopPlayback();
    const idx = replayData.candles.findIndex(c => c.time >= targetTime);
    const n   = idx >= 0 ? idx + 1 : replayData.candles.length;
    revealedRef.current = n;
    setRevealed(n);
    seriesRef.current.setData(replayData.candles.slice(0, n));
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-3 mt-4">
        <div className="skeleton h-[420px] w-full rounded-xl" />
        <div className="flex items-center gap-2">
          <div className="skeleton h-10 w-24 rounded-lg" />
          <div className="skeleton h-10 flex-1 rounded-lg" />
          <div className="skeleton h-10 w-36 rounded-lg" />
        </div>
      </div>
    );
  }

  // ── Unavailable state ─────────────────────────────────────────────────────
  if (unavailable) {
    return (
      <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-100)] py-16 px-6 text-center gap-4">
        <div className="w-14 h-14 rounded-full bg-[var(--color-surface-200)] flex items-center justify-center">
          <Film size={28} className="text-[var(--color-text-muted)]" />
        </div>
        <div>
          <p className="text-base font-semibold text-[var(--color-text-primary)] mb-1">
            Replay not available
          </p>
          <p className="text-sm text-[var(--color-text-muted)] max-w-md leading-relaxed">
            {unavailable}
          </p>
        </div>
        <div className="flex items-start gap-1.5 text-xs text-[var(--color-warning)] bg-[var(--color-warning-subtle)] rounded-lg px-3 py-2 max-w-sm">
          <AlertTriangle size={13} className="mt-0.5 shrink-0" />
          <span>Replay requires a closed trade with both entry and exit dates, and a symbol supported by the market data provider.</span>
        </div>
      </div>
    );
  }

  if (!replayData) return null;

  const pct       = total > 0 ? Math.round((revealed / total) * 100) : 0;
  const entryTime = replayData.markers.entry?.time;
  const exitTime  = replayData.markers.exit?.time;

  // ── Chart + controls ──────────────────────────────────────────────────────
  return (
    <div className="mt-4 space-y-3">

      {/* ── Legend / info row ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--color-text-muted)]">Timeframe</span>
          <span className="rounded-full bg-[var(--color-brand-subtle)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-brand)]">
            {replayData.timeframe}
          </span>
          <span className="text-xs text-[var(--color-text-muted)]">{total} candles</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--color-text-muted)]">
          {replayData.markers.stopLoss   != null && (
            <span className="flex items-center gap-1">
              <svg width="20" height="6"><line x1="0" y1="3" x2="20" y2="3" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="4 2"/></svg>
              SL
            </span>
          )}
          {replayData.markers.takeProfit != null && (
            <span className="flex items-center gap-1">
              <svg width="20" height="6"><line x1="0" y1="3" x2="20" y2="3" stroke="#22C55E" strokeWidth="1.5" strokeDasharray="4 2"/></svg>
              TP
            </span>
          )}
          {entryTime != null && (
            <span className="flex items-center gap-1">
              <TrendingUp size={11} className="text-[var(--color-brand)]" /> Entry
            </span>
          )}
          {exitTime != null && (
            <span className="flex items-center gap-1">
              <TrendingDown size={11} style={{ color: '#22D3EE' }} /> Exit
            </span>
          )}
        </div>
      </div>

      {/* ── Chart container ────────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="w-full rounded-xl overflow-hidden border border-[var(--color-border)]"
        style={{ minHeight: 420 }}
      />

      {/* ── Playback controls ──────────────────────────────────────────────── */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-100)] p-3 space-y-2.5">

        {/* Scrubber row */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-num text-[var(--color-text-muted)] w-8 text-right shrink-0">
            {revealed}
          </span>
          <input
            id="replay-scrubber"
            type="range"
            min={1}
            max={total}
            value={revealed}
            onChange={handleScrub}
            className="flex-1 h-1.5 rounded-full cursor-pointer"
            style={{ accentColor: 'var(--brand-indigo)' }}
          />
          <span className="text-xs font-num text-[var(--color-text-muted)] w-8 shrink-0">
            {total}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 rounded-full bg-[var(--color-surface-200)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-75"
            style={{
              width:      `${pct}%`,
              background: 'linear-gradient(90deg, #5B6CFF, #22D3EE)',
            }}
          />
        </div>

        {/* Buttons row */}
        <div className="flex flex-wrap items-center gap-2">

          {/* Play / Pause */}
          <button
            id="replay-play-pause"
            onClick={handlePlayPause}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--color-brand)] px-4 py-1.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          >
            {playing
              ? <><Pause size={14} /> Pause</>
              : <><Play  size={14} /> {revealed >= total ? 'Replay' : 'Play'}</>
            }
          </button>

          {/* Speed buttons */}
          <div className="flex items-center rounded-lg border border-[var(--color-border)] overflow-hidden">
            {SPEEDS.map(s => (
              <button
                key={s.value}
                id={`replay-speed-${String(s.value).replace('.', '_')}x`}
                onClick={() => setSpeed(s.value)}
                className={[
                  'px-2.5 py-1.5 text-xs font-semibold transition-colors',
                  speed === s.value
                    ? 'bg-[var(--color-brand)] text-white'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]',
                ].join(' ')}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          {/* Jump buttons */}
          {entryTime != null && (
            <button
              id="replay-jump-entry"
              onClick={() => jumpTo(entryTime)}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-brand)] hover:bg-[var(--color-brand-subtle)] transition-colors"
            >
              <SkipBack size={13} /> Jump to Entry
            </button>
          )}
          {exitTime != null && (
            <button
              id="replay-jump-exit"
              onClick={() => jumpTo(exitTime)}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium transition-colors"
              style={{ color: '#22D3EE' }}
            >
              Jump to Exit <SkipForward size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
