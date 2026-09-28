/**
 * pages/auth/ResetPasswordPage.jsx
 */

import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { toastSuccess, toastError } from '@/features/ui/toastSlice';
import { apiResetPassword } from '@/api/auth';
import Button from '@/components/ui/Button';
import PasswordStrength from '@/components/ui/PasswordStrength';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const schema = z
  .object({
    password: z.string().regex(PASSWORD_REGEX, 'Min 8 chars with uppercase, lowercase, and number'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({ resolver: zodResolver(schema) });
  const password = watch('password', '');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await apiResetPassword(token, { password: data.password, confirmPassword: data.confirmPassword });
      dispatch(toastSuccess('Password updated! Please sign in.'));
      navigate('/signin');
    } catch (err) {
      dispatch(toastError(err.response?.data?.error?.message || 'Reset link is invalid or expired.'));
    } finally {
      setLoading(false);
    }
  };

  const inputCls = (err) => [
    'w-full h-9 rounded-md border px-3 text-sm pr-10',
    'bg-[var(--color-surface-200)] text-[var(--color-text-primary)]',
    'placeholder:text-[var(--color-text-muted)]',
    'focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent transition-all',
    err ? 'border-[var(--color-loss)]' : 'border-[var(--color-border)]',
  ].join(' ');

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Set a new password</h1>
        <p className="mt-1.5 text-sm text-[var(--color-text-secondary)]">
          Choose a strong password for your Tradiary account.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">New password</label>
          <div className="relative">
            <input {...register('password')} type={showPw ? 'text' : 'password'} id="reset-password" placeholder="New password" className={inputCls(errors.password)} />
            <button type="button" tabIndex={-1} onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <PasswordStrength password={password} />
          {errors.password && <p className="mt-1 text-xs text-[var(--color-loss-text)]">{errors.password.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Confirm password</label>
          <input {...register('confirmPassword')} type="password" id="reset-confirm" placeholder="Confirm new password" className={inputCls(errors.confirmPassword)} />
          {errors.confirmPassword && <p className="mt-1 text-xs text-[var(--color-loss-text)]">{errors.confirmPassword.message}</p>}
        </div>

        <Button type="submit" fullWidth size="lg" loading={loading} leftIcon={<KeyRound size={16} />}>
          Update password
        </Button>
      </form>

      <Link to="/signin" className="mt-6 flex justify-center text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
        Back to sign in
      </Link>
    </div>
  );
};

export default ResetPasswordPage;
