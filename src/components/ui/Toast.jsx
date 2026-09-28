/**
 * components/ui/Toast.jsx
 * Animated toast notification portal.
 */

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { selectToasts, removeToast } from '@/features/ui/toastSlice';

const icons = {
  success: <CheckCircle2 size={16} className="shrink-0 text-[var(--color-gain)]" />,
  error:   <XCircle     size={16} className="shrink-0 text-[var(--color-loss)]" />,
  info:    <Info        size={16} className="shrink-0 text-[var(--color-brand)]" />,
  warning: <AlertTriangle size={16} className="shrink-0 text-[var(--color-warning)]" />,
};

const borders = {
  success: 'border-l-[var(--color-gain)]',
  error:   'border-l-[var(--color-loss)]',
  info:    'border-l-[var(--color-brand)]',
  warning: 'border-l-[var(--color-warning)]',
};

const ToastItem = ({ id, message, type, duration }) => {
  const dispatch = useDispatch();
  const dismiss = () => dispatch(removeToast(id));

  useEffect(() => {
    const t = setTimeout(dismiss, duration);
    return () => clearTimeout(t);
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      role="alert"
      className={[
        'flex items-start gap-3 rounded-lg border border-[var(--color-border)] border-l-4',
        'bg-[var(--color-surface)] px-4 py-3 shadow-card',
        'w-80 max-w-[calc(100vw-2rem)]',
        'animate-fade-in',
        borders[type] || borders.info,
      ].join(' ')}
    >
      {icons[type] || icons.info}
      <p className="flex-1 text-sm text-[var(--color-text-primary)]">{message}</p>
      <button
        onClick={dismiss}
        className="shrink-0 rounded p-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
};

const Toaster = () => {
  const toasts = useSelector(selectToasts);

  return createPortal(
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} {...t} />
      ))}
    </div>,
    document.body
  );
};

export default Toaster;
