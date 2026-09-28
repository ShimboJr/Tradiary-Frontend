/**
 * components/ui/Input.jsx
 * Shared text input primitive with label, error, left/right addons.
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
            className="text-sm font-medium text-[var(--color-text-secondary)]"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftAddon && (
            <span className="absolute left-3 flex items-center text-[var(--color-text-muted)]">
              {leftAddon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            className={[
              'w-full rounded-md border bg-[var(--color-surface-200)]',
              'text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]',
              'transition-all duration-[var(--transition-fast)]',
              'focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent',
              'h-9 px-3 text-sm',
              leftAddon ? 'pl-9' : '',
              rightAddon ? 'pr-9' : '',
              error
                ? 'border-[var(--color-loss)] focus:ring-[var(--color-loss)]'
                : 'border-[var(--color-border)]',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            {...props}
          />

          {rightAddon && (
            <span className="absolute right-3 flex items-center text-[var(--color-text-muted)]">
              {rightAddon}
            </span>
          )}
        </div>

        {error && (
          <p className="text-xs text-[var(--color-loss-text)]">{error}</p>
        )}
        {hint && !error && (
          <p className="text-xs text-[var(--color-text-muted)]">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
