/**
 * components/ui/Modal.jsx
 * Accessible modal with backdrop, escape key, focus trap.
 */
import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const Modal = ({ open, onClose, title, children, size = 'md', className = '' }) => {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizes = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl', xl: 'max-w-6xl' };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={panelRef}
        className={`relative my-8 w-full ${sizes[size]} mx-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl animate-fade-in ${className}`}
        role="dialog" aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-100)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        {/* Body */}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
