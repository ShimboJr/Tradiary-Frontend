/**
 * pages/auth/VerifyEmailPage.jsx
 * Auto-calls the verify endpoint on mount with the token from the URL.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { apiVerifyEmail } from '@/api/auth';
import { useDispatch } from 'react-redux';
import { fetchMe } from '@/features/auth/authSlice';

const VerifyEmailPage = () => {
  const { token } = useParams();
  const dispatch = useDispatch();
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');
  // Guard against React StrictMode double-invoking the effect, which would
  // consume the one-time token on the first call and fail on the second.
  const hasVerified = useRef(false);

  useEffect(() => {
    if (hasVerified.current) return;
    hasVerified.current = true;

    const verify = async () => {
      try {
        const res = await apiVerifyEmail(token);
        setStatus('success');
        setMessage(res.data.message || 'Email verified successfully.');
        // Refresh user data so the banner disappears
        dispatch(fetchMe());
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.error?.message || 'Verification link is invalid or has expired.');
      }
    };
    verify();
  }, [token, dispatch]);

  return (
    <div className="animate-fade-in text-center">
      {status === 'loading' && (
        <>
          <Loader2 size={40} className="mx-auto mb-4 animate-spin text-[var(--color-brand)]" />
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Verifying your email…</h1>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-gain-subtle)]">
            <CheckCircle2 size={32} className="text-[var(--color-gain)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Email verified!</h1>
          <p className="mt-3 text-sm text-[var(--color-text-secondary)]">{message}</p>
          <Link to="/app/dashboard" className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-brand)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-brand-muted)] transition-colors">
            Go to dashboard
          </Link>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-loss-subtle)]">
            <XCircle size={32} className="text-[var(--color-loss)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Verification failed</h1>
          <p className="mt-3 text-sm text-[var(--color-text-secondary)]">{message}</p>
          <Link to="/app/dashboard" className="mt-6 inline-flex items-center gap-1.5 text-sm text-[var(--color-brand)] hover:underline">
            Back to app
          </Link>
        </>
      )}
    </div>
  );
};

export default VerifyEmailPage;
