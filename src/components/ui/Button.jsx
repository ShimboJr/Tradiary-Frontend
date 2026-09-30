/**
 * components/ui/Button.jsx
 * Shared Button primitive — brand-spec CSS variables.
 * Supports: variant, size, loading state, leftIcon, rightIcon.
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

const variants = {
  primary:   'bg-[var(--brand-indigo)] hover:opacity-90 text-white shadow-sm',
  secondary: 'bg-[var(--surface-raised)] hover:bg-[var(--surface-100)] text-[var(--text)] border border-[var(--border)]',
  ghost:     'bg-transparent hover:bg-[var(--surface-100)] text-[var(--text-muted)] hover:text-[var(--text)]',
  danger:    'bg-[var(--loss)] hover:opacity-90 text-white',
  success:   'bg-[var(--gain)] hover:opacity-90 text-white',
  outline:   'border border-[var(--brand-indigo)] text-[var(--brand-indigo)] hover:bg-[var(--brand-indigo-subtle)] bg-transparent',
};

const sizes = {
  xs: 'h-7 px-2.5 text-xs rounded',
  sm: 'h-8 px-3 text-sm rounded-lg',
  md: 'h-9 px-4 text-sm rounded-lg',
  lg: 'h-11 px-6 text-base rounded-xl',
  xl: 'h-12 px-8 text-base rounded-xl',
};

/**
 * @param {object} props
 * @param {'primary'|'secondary'|'ghost'|'danger'|'success'|'outline'} [props.variant='primary']
 * @param {'xs'|'sm'|'md'|'lg'|'xl'} [props.size='md']
 * @param {boolean} [props.loading=false]
 * @param {boolean} [props.fullWidth=false]
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
          'inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap',
          'transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-indigo)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]',
          variants[variant] ?? variants.primary,
          sizes[size] ?? sizes.md,
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
