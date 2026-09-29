/**
 * components/ui/EmptyState.jsx
 * Consistent empty state display across all pages.
 *
 * Props:
 *   icon      — Lucide icon component (default: Inbox)
 *   title     — Short heading (required)
 *   message   — Longer explanation (optional)
 *   action    — { label: string, onClick: fn } or { label: string, to: string }
 *   size      — 'sm' | 'md' (default)
 */

import React from 'react';
import { Inbox } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from './Button';

const EmptyState = ({
  icon: Icon = Inbox,
  title,
  message,
  action,
  size = 'md',
}) => {
  const iconSize  = size === 'sm' ? 32 : 48;
  const padding   = size === 'sm' ? 'py-10' : 'py-16';

  return (
    <div className={`flex flex-col items-center justify-center text-center ${padding} px-6`}>
      {/* Illustration circle */}
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--surface-100)] border border-[var(--border)]">
        <Icon size={iconSize * 0.6} className="text-[var(--text-muted)]" />
      </div>

      <h3 className="text-base font-semibold text-[var(--text)]">{title}</h3>

      {message && (
        <p className="mt-1.5 max-w-xs text-sm text-[var(--text-muted)] leading-relaxed">
          {message}
        </p>
      )}

      {action && (
        <div className="mt-5">
          {action.to ? (
            <Link to={action.to}>
              <Button size="sm">{action.label}</Button>
            </Link>
          ) : (
            <Button size="sm" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
