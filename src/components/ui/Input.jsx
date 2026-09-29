/**
 * components/ui/Input.jsx
 * Shared text input primitive with optional label, error, hint, left/right addons.
 */

import React from 'react';

const Input = React.forwardRef(
  (
    {
      label,
      error,
      hint,
      leftAddon,
      rightAddon,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2, 7)}`;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--text)]"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftAddon && (
            <span className="absolute left-3 flex items-center text-[var(--text-muted)]">
              {leftAddon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            className={[
              'w-full rounded-lg border bg-[var(--surface-200)]',
              'text-[var(--text)] placeholder:text-[var(--text-muted)]',
              'transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-[var(--brand-indigo)] focus:border-transparent',
              'h-9 px-3 text-sm',
              leftAddon  ? 'pl-9'  : '',
              rightAddon ? 'pr-9'  : '',
              error
                ? 'border-[var(--loss)] focus:ring-[var(--loss)]'
                : 'border-[var(--border)]',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            {...props}
          />

          {rightAddon && (
            <span className="absolute right-3 flex items-center text-[var(--text-muted)]">
              {rightAddon}
            </span>
          )}
        </div>

        {error && (
          <p className="text-xs text-[var(--loss-text)]">{error}</p>
        )}
        {hint && !error && (
          <p className="text-xs text-[var(--text-muted)]">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
