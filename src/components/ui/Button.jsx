/**
 * components/ui/Button.jsx
 * Shared Button primitive with variant, size, and loading state.
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

const variants = {
  primary:  'bg-[var(--color-brand)] hover:bg-[var(--color-brand-muted)] text-white shadow-sm',
  secondary:'bg-[var(--color-surface-100)] hover:bg-[var(--color-surface-200)] text-[var(--color-text-primary)] border border-[var(--color-border)]',
  ghost:    'bg-transparent hover:bg-[var(--color-surface-200)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
  danger:   'bg-[var(--color-loss)] hover:opacity-90 text-white',
  success:  'bg-[var(--color-gain)] hover:opacity-90 text-[var(--color-text-inverted)]',
  outline:  'border border-[var(--color-brand)] text-[var(--color-brand)] hover:bg-[var(--color-brand-subtle)] bg-transparent',
};

const sizes = {
  xs:  'h-7 px-2.5 text-xs rounded',
  sm:  'h-8 px-3 text-sm rounded',
  md:  'h-9 px-4 text-sm rounded-md',
  lg:  'h-11 px-6 text-base rounded-md',
  xl:  'h-12 px-8 text-base rounded-lg',
};

/**
 * @param {object} props
 * @param {'primary'|'secondary'|'ghost'|'danger'|'success'|'outline'} [props.variant]
 * @param {'xs'|'sm'|'md'|'lg'|'xl'} [props.size]
 * @param {boolean} [props.loading]
 * @param {boolean} [props.fullWidth]
 * @param {React.ReactNode} [props.leftIcon]
 * @param {React.ReactNode} [props.rightIcon]
 */
const Button = React.forwardRef(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={[
          'inline-flex items-center justify-center gap-2 font-medium',
          'transition-all duration-[var(--transition-fast)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]',
          variants[variant],
          sizes[size],
          fullWidth ? 'w-full' : '',
          isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {loading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children}
        {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
