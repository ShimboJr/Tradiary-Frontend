/**
 * components/ui/Badge.jsx
 * Semantic badge for P&L states, trade direction, etc.
 */
import React from 'react';

const variantMap = {
  gain:    'bg-[var(--color-gain-subtle)] text-[var(--color-gain-text)] border border-[var(--color-gain)]/30',
  loss:    'bg-[var(--color-loss-subtle)] text-[var(--color-loss-text)] border border-[var(--color-loss)]/30',
  brand:   'bg-[var(--color-brand-subtle)] text-[var(--color-brand)] border border-[var(--color-brand)]/30',
  neutral: 'bg-[var(--color-surface-200)] text-[var(--color-text-secondary)] border border-[var(--color-border)]',
  warning: 'bg-[var(--color-warning-subtle)] text-[var(--color-warning)] border border-[var(--color-warning)]/30',
};

const Badge = ({ variant = 'neutral', children, className = '' }) => (
  <span
    className={[
      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
      variantMap[variant],
      className,
    ]
      .filter(Boolean)
      .join(' ')}
  >
    {children}
  </span>
);

export default Badge;
