/**
 * pages/auth/ForgotPasswordPage.jsx
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ArrowLeft } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { toastSuccess, toastError } from '@/features/ui/toastSlice';
import { apiForgotPassword } from '@/api/auth';
import Button from '@/components/ui/Button';
import { useState } from 'react';

const schema = z.object({ email: z.string().email('Enter a valid email') });

const ForgotPasswordPage = () => {
  const dispatch = useDispatch();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await apiForgotPassword(data);
      setSent(true);
      dispatch(toastSuccess('Reset link sent if that email exists.'));
    } catch {
      dispatch(toastError('Something went wrong. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="animate-fade-in text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-brand-subtle)]">
          <Mail size={24} className="text-[var(--color-brand)]" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Check your inbox</h1>
        <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
          If an account exists for that email, we've sent a password reset link. It expires in 1 hour.
        </p>
        <Link to="/signin" className="mt-6 inline-flex items-center gap-1.5 text-sm text-[var(--color-brand)] hover:underline">
          <ArrowLeft size={14} /> Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Forgot your password?</h1>
        <p className="mt-1.5 text-sm text-[var(--color-text-secondary)]">
          Enter your email and we'll send a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
            Email address
          </label>
          <input
            {...register('email')}
            type="email"
            id="forgot-email"
            placeholder="you@example.com"
            className={[
              'w-full h-9 rounded-md border px-3 text-sm',
              'bg-[var(--color-surface-200)] text-[var(--color-text-primary)]',
              'placeholder:text-[var(--color-text-muted)]',
              'focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent transition-all',
              errors.email ? 'border-[var(--color-loss)]' : 'border-[var(--color-border)]',
            ].join(' ')}
          />
          {errors.email && <p className="mt-1 text-xs text-[var(--color-loss-text)]">{errors.email.message}</p>}
        </div>

        <Button type="submit" fullWidth size="lg" loading={loading} leftIcon={<Mail size={16} />}>
          Send reset link
        </Button>
      </form>

      <Link to="/signin" className="mt-6 flex items-center justify-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
        <ArrowLeft size={14} /> Back to sign in
      </Link>
    </div>
  );
};

export default ForgotPasswordPage;
