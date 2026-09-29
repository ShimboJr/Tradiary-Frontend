/**
 * components/ui/Badge.jsx
 */
import React from 'react';

const VARIANTS = {
  long:         'bg-[var(--color-gain-subtle)]   text-[var(--color-gain-text)]',
  short:        'bg-[var(--color-loss-subtle)]   text-[var(--color-loss-text)]',
  open:         'bg-[var(--color-warning-subtle)] text-[var(--color-warning)]',
  closed:       'bg-[var(--color-surface-200)]   text-[var(--color-text-secondary)]',
  winner:       'bg-[var(--color-gain-subtle)]   text-[var(--color-gain-text)]',
  loser:        'bg-[var(--color-loss-subtle)]   text-[var(--color-loss-text)]',
  default:      'bg-[var(--color-surface-200)]   text-[var(--color-text-secondary)]',
  brand:        'bg-[var(--color-brand-subtle)]  text-[var(--color-brand)]',
  A: 'bg-emerald-900/30 text-emerald-400',
  B: 'bg-blue-900/30   text-blue-400',
  C: 'bg-yellow-900/30 text-yellow-400',
  D: 'bg-orange-900/30 text-orange-400',
  F: 'bg-red-900/30    text-red-400',
};

const Badge = ({ children, variant = 'default', className = '' }) => (
  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${VARIANTS[variant] || VARIANTS.default} ${className}`}>
    {children}
  </span>
);

export default Badge;
