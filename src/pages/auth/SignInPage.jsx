/**
 * pages/auth/SignInPage.jsx
 * Email/password login + Google sign-in.
 */

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { GoogleLogin } from '@react-oauth/google';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { login, googleAuth, selectIsLoading } from '@/features/auth/authSlice';
import { toastSuccess, toastError } from '@/features/ui/toastSlice';
import Button from '@/components/ui/Button';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional(),
});

const SignInPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const loading = useSelector(selectIsLoading);
  const [showPw, setShowPw] = useState(false);

  const from = location.state?.from?.pathname || '/app/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { remember: true } });

  const onSubmit = async (data) => {
    const result = await dispatch(login(data));
    if (login.fulfilled.match(result)) {
      dispatch(toastSuccess('Welcome back!'));
      navigate(from, { replace: true });
    } else {
      dispatch(toastError(result.payload || 'Sign-in failed.'));
    }
  };

  const onGoogleSuccess = async (response) => {
    const result = await dispatch(googleAuth(response.credential));
    if (googleAuth.fulfilled.match(result)) {
      dispatch(toastSuccess('Signed in with Google!'));
      navigate(from, { replace: true });
    } else {
      dispatch(toastError(result.payload || 'Google sign-in failed.'));
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Welcome back</h1>
        <p className="mt-1.5 text-sm text-[var(--color-text-secondary)]">
          Don't have an account?{' '}
          <Link to="/signup" className="font-medium text-[var(--color-brand)] hover:underline">
            Sign up free
          </Link>
        </p>
      </div>

      {/* Google button */}
      <div className="mb-6">
        <GoogleLogin
          onSuccess={onGoogleSuccess}
          onError={() => dispatch(toastError('Google sign-in failed.'))}
          theme="filled_black"
          size="large"
          width="100%"
          shape="rectangular"
          text="signin_with"
        />
      </div>

      {/* Divider */}
      <div className="relative mb-6 flex items-center">
        <div className="flex-1 border-t border-[var(--color-border)]" />
        <span className="mx-4 text-xs text-[var(--color-text-muted)]">or continue with email</span>
        <div className="flex-1 border-t border-[var(--color-border)]" />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
            Email address
          </label>
          <input
            {...register('email')}
            type="email"
            id="signin-email"
            placeholder="you@example.com"
            autoComplete="email"
            className={inputCls(errors.email)}
          />
          {errors.email && <p className="mt-1 text-xs text-[var(--color-loss-text)]">{errors.email.message}</p>}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-[var(--color-text-secondary)]">Password</label>
            <Link to="/forgot-password" className="text-xs text-[var(--color-brand)] hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              {...register('password')}
              type={showPw ? 'text' : 'password'}
              id="signin-password"
              placeholder="Your password"
              autoComplete="current-password"
              className={inputCls(errors.password) + ' pr-10'}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            >
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-[var(--color-loss-text)]">{errors.password.message}</p>}
        </div>

        {/* Remember me */}
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            {...register('remember')}
            type="checkbox"
            id="signin-remember"
            className="h-4 w-4 rounded border-[var(--color-border)] bg-[var(--color-surface-200)] text-[var(--color-brand)] accent-[var(--color-brand)]"
          />
          <span className="text-sm text-[var(--color-text-secondary)]">Keep me signed in</span>
        </label>

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={loading}
          leftIcon={<LogIn size={16} />}
          className="mt-2"
        >
          Sign in
        </Button>
      </form>
    </div>
  );
};

const inputCls = (error) =>
  [
    'w-full h-9 rounded-md border px-3 text-sm',
    'bg-[var(--color-surface-200)] text-[var(--color-text-primary)]',
    'placeholder:text-[var(--color-text-muted)]',
    'focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent',
    'transition-all duration-150',
    error
      ? 'border-[var(--color-loss)] focus:ring-[var(--color-loss)]'
      : 'border-[var(--color-border)]',
  ].join(' ');

export default SignInPage;
