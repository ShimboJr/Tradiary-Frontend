/**
 * components/ui/Logo.jsx
 * Tradiary brand logo component.
 *
 * Props:
 *   variant — "full" (icon + wordmark), "icon" (icon only), "mono" (white single-color)
 *   size    — icon height in px (default 32). Wordmark scales proportionally.
 *   className — extra classes on the root element
 *
 * The gradient ID is made unique per instance via useId() so multiple Logos
 * on one page (nav + sidebar) don't collide.
 */

import React, { useId } from 'react';

const Logo = ({ variant = 'full', size = 32, className = '' }) => {
  const uid = useId();
  const gradId = `tg-${uid.replace(/:/g, '')}`;

  // Wordmark font size scales ~0.7× the icon height, min 14px
  const wordmarkSize = Math.max(14, Math.round(size * 0.69));
  // Gap between icon and wordmark
  const gap = Math.round(size * 0.3125); // ~10px at 32px

  // ── Icon SVG ────────────────────────────────────────────────────────────────
  const IconMark = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <defs>
        {variant === 'mono' ? null : (
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#5B6CFF" />
            <stop offset="1" stopColor="#22D3EE" />
          </linearGradient>
        )}
      </defs>
      <rect
        width="64"
        height="64"
        rx="15"
        fill={variant === 'mono' ? 'white' : `url(#${gradId})`}
      />
      {/* Top bar of T */}
      <rect
        x="14" y="14" width="36" height="9" rx="4.5"
        fill={variant === 'mono' ? '#0B1220' : '#FFFFFF'}
      />
      {/* Stem of T / candlestick body */}
      <rect
        x="26" y="18" width="12" height="27" rx="3.5"
        fill={variant === 'mono' ? '#0B1220' : '#FFFFFF'}
      />
      {/* Candlestick wick tail */}
      <line
        x1="32" y1="44" x2="32" y2="52"
        stroke={variant === 'mono' ? '#0B1220' : '#FFFFFF'}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );

  // ── Icon only ───────────────────────────────────────────────────────────────
  if (variant === 'icon') {
    return (
      <span
        className={`inline-flex items-center ${className}`}
        aria-label="Tradiary"
        role="img"
      >
        <IconMark />
      </span>
    );
  }

  // ── Full lockup (icon + wordmark) ────────────────────────────────────────────
  // "Tra" in --text color, "diary" in --brand-cyan (dark) / --brand-indigo (light)
  return (
    <span
      className={`inline-flex items-center select-none ${className}`}
      aria-label="Tradiary"
      role="img"
    >
      <IconMark />
      <span
        style={{
          marginLeft: gap,
          fontFamily: "'Manrope', 'Inter', system-ui, sans-serif",
          fontWeight: 700,
          fontSize: wordmarkSize,
          letterSpacing: '-0.02em',
          lineHeight: 1,
          color: 'var(--text)',
        }}
        aria-hidden="true"
      >
        Tra
        <span className="wordmark-diary" style={{ color: 'var(--brand-cyan)' }}>
          diary
        </span>
      </span>
    </span>
  );
};

export default Logo;
