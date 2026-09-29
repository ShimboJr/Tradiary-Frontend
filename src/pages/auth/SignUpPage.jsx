/**
 * pages/auth/SignUpPage.jsx
 * Email/password registration + Google sign-up.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { GoogleLogin } from '@react-oauth/google';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { register as registerThunk, googleAuth, selectIsLoading } from '@/features/auth/authSlice';
import { toastSuccess, toastError } from '@/features/ui/toastSlice';
import Button from '@/components/ui/Button';
import PasswordStrength from '@/components/ui/PasswordStrength';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const schema = z
  .object({
    name: z.string().min(1, 'Name is required').max(80),
    email: z.string().email('Enter a valid email'),
    password: z
      .string()
      .regex(PASSWORD_REGEX, 'Min 8 chars with uppercase, lowercase, and number'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const SignUpPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loading = useSelector(selectIsLoading);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const password = watch('password', '');

  const onSubmit = async (data) => {
    const result = await dispatch(registerThunk(data));
    if (registerThunk.fulfilled.match(result)) {
      dispatch(toastSuccess('Account created! Please verify your email.'));
      navigate('/app/dashboard');
    } else {
      dispatch(toastError(result.payload || 'Registration failed.'));
    }
  };

  const onGoogleSuccess = async (response) => {
    const result = await dispatch(googleAuth(response.credential));
    if (googleAuth.fulfilled.match(result)) {
      dispatch(toastSuccess('Signed in with Google!'));
      navigate('/app/dashboard');
    } else {
      dispatch(toastError(result.payload || 'Google sign-in failed.'));
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Create your account</h1>
        <p className="mt-1.5 text-sm text-[var(--color-text-secondary)]">
          Already have one?{' '}
          <Link to="/signin" className="font-medium text-[var(--color-brand)] hover:underline">
            Sign in
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
          text="signup_with"
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
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
            Full name
          </label>
          <input
            {...register('name')}
            type="text"
            id="signup-name"
            placeholder="Alex Johnson"
            autoComplete="name"
            className={inputCls(errors.name)}
          />
          {errors.name && <p className="mt-1 text-xs text-[var(--color-loss-text)]">{errors.name.message}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
            Email address
          </label>
          <input
            {...register('email')}
            type="email"
            id="signup-email"
            placeholder="you@example.com"
            autoComplete="email"
            className={inputCls(errors.email)}
          />
          {errors.email && <p className="mt-1 text-xs text-[var(--color-loss-text)]">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPw ? 'text' : 'password'}
              id="signup-password"
              placeholder="Min 8 chars, upper, lower, number"
              autoComplete="new-password"
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
          <PasswordStrength password={password} />
          {errors.password && <p className="mt-1 text-xs text-[var(--color-loss-text)]">{errors.password.message}</p>}
        </div>

        {/* Confirm password */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
            Confirm password
          </label>
          <div className="relative">
            <input
              {...register('confirmPassword')}
              type={showConfirm ? 'text' : 'password'}
              id="signup-confirm"
              placeholder="Repeat your password"
              autoComplete="new-password"
              className={inputCls(errors.confirmPassword) + ' pr-10'}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            >
              {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-[var(--color-loss-text)]">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={loading}
          leftIcon={<UserPlus size={16} />}
          className="mt-2"
        >
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-[var(--color-text-muted)]">
        By signing up you agree to our{' '}
        <Link to="/terms" target="_blank" rel="noopener noreferrer" className="text-[var(--color-brand)] hover:underline">Terms</Link>
        {' '}and{' '}
        <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="text-[var(--color-brand)] hover:underline">Privacy Policy</Link>.
      </p>
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

export default SignUpPage;
