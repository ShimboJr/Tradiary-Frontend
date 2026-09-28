/**
 * components/layout/EmailVerifyBanner.jsx
 * Persistent top banner shown when user's email is not verified.
 * Sticks below the topbar inside the AppShell.
 */

import React, { useState } from 'react';
import { Mail, X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser } from '@/features/auth/authSlice';
import { toastSuccess, toastError } from '@/features/ui/toastSlice';
import { apiResendVerify } from '@/api/auth';

const EmailVerifyBanner = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);

  if (!user || user.isEmailVerified || dismissed) return null;

  const resend = async () => {
    setSending(true);
    try {
      await apiResendVerify();
      dispatch(toastSuccess('Verification email sent! Check your inbox.'));
    } catch {
      dispatch(toastError('Failed to resend. Please try again.'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-3 border-b border-[var(--color-warning)]/30 bg-[var(--color-warning-subtle)] px-6 py-2.5"
    >
      <div className="flex items-center gap-2.5 text-sm">
        <Mail size={15} className="shrink-0 text-[var(--color-warning)]" />
        <span className="text-[var(--color-text-secondary)]">
          Please verify your email address to unlock all features.
        </span>
        <button
          onClick={resend}
          disabled={sending}
          className="font-medium text-[var(--color-warning)] hover:underline disabled:opacity-50 transition-opacity"
        >
          {sending ? 'Sending…' : 'Resend email'}
        </button>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
        title="Dismiss"
      >
        <X size={15} />
      </button>
    </div>
  );
};

export default EmailVerifyBanner;
