/**
 * pages/app/SettingsPage.jsx
 * Full settings page with 4 tabs: Profile, Security, Accounts, Data.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User,
  Shield,
  Wallet,
  Database,
  Camera,
  Save,
  Plus,
  Pencil,
  Archive,
  Trash2,
  LogOut,
  Download,
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  Link2,
} from 'lucide-react';
import { selectCurrentUser, updateUser, logout as logoutAction } from '@/features/auth/authSlice';
import { setTheme, selectTheme } from '@/features/ui/uiSlice';
import { toastSuccess, toastError } from '@/features/ui/toastSlice';
import axios from '@/api/axiosInstance';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import PasswordStrength from '@/components/ui/PasswordStrength';

// ── Timezone list (common IANA zones) ─────────────────────────────────────────
const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver',
  'America/Los_Angeles', 'America/Toronto', 'America/Vancouver',
  'America/Sao_Paulo', 'Europe/London', 'Europe/Paris', 'Europe/Berlin',
  'Europe/Amsterdam', 'Europe/Madrid', 'Europe/Rome', 'Europe/Moscow',
  'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore', 'Asia/Hong_Kong',
  'Asia/Tokyo', 'Asia/Seoul', 'Australia/Sydney', 'Pacific/Auckland',
];

// ── Currency list ──────────────────────────────────────────────────────────────
const CURRENCIES = [
  { code: 'USD', label: 'US Dollar (USD)' },
  { code: 'EUR', label: 'Euro (EUR)' },
  { code: 'GBP', label: 'British Pound (GBP)' },
  { code: 'JPY', label: 'Japanese Yen (JPY)' },
  { code: 'CAD', label: 'Canadian Dollar (CAD)' },
  { code: 'AUD', label: 'Australian Dollar (AUD)' },
  { code: 'CHF', label: 'Swiss Franc (CHF)' },
  { code: 'HKD', label: 'Hong Kong Dollar (HKD)' },
  { code: 'SGD', label: 'Singapore Dollar (SGD)' },
  { code: 'INR', label: 'Indian Rupee (INR)' },
  { code: 'BRL', label: 'Brazilian Real (BRL)' },
  { code: 'ZAR', label: 'South African Rand (ZAR)' },
];

// ── Tab definitions ───────────────────────────────────────────────────────────
const TABS = [
  { id: 'profile',   label: 'Profile',   icon: User },
  { id: 'security',  label: 'Security',  icon: Shield },
  { id: 'accounts',  label: 'Accounts',  icon: Wallet },
  { id: 'data',      label: 'Data',      icon: Database },
];

// ── Zod schemas ───────────────────────────────────────────────────────────────
const profileSchema = z.object({
  name:         z.string().min(1, 'Name is required').max(80),
  timezone:     z.string().min(1),
  baseCurrency: z.string().length(3),
});

// Password must have ≥8 chars, uppercase, number, and special char — same rules as signup
const strongPassword = z
  .string()
  .min(8, 'At least 8 characters')
  .regex(/[A-Z]/, 'At least one uppercase letter')
  .regex(/\d/, 'At least one number')
  .regex(/[^a-zA-Z0-9]/, 'At least one special character (!@#$…)');

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword:     strongPassword,
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const setPasswordSchema = z.object({
  newPassword:     strongPassword,
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const accountSchema = z.object({
  name:           z.string().min(1, 'Name is required'),
  broker:         z.string().optional(),
  currency:       z.string().length(3).optional(),
  initialBalance: z.coerce.number().min(0).optional(),
});

// ── Field ─────────────────────────────────────────────────────────────────────
const Field = ({ label, children, error }) => (
  <div>
    <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">{label}</label>
    {children}
    {error && <p className="mt-1 text-xs text-[var(--loss-text)]">{error}</p>}
  </div>
);

// ── Section ───────────────────────────────────────────────────────────────────
const Section = ({ title, desc, children }) => (
  <div className="border-b border-[var(--border)] pb-8 mb-8 last:border-0 last:mb-0 last:pb-0">
    <div className="mb-5">
      <h3 className="font-semibold text-[var(--text)]">{title}</h3>
      {desc && <p className="mt-0.5 text-sm text-[var(--text-muted)]">{desc}</p>}
    </div>
    {children}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// Profile Tab
// ═══════════════════════════════════════════════════════════════════════════════
const ProfileTab = () => {
  const dispatch = useDispatch();
  const user     = useSelector(selectCurrentUser);
  const theme    = useSelector(selectTheme);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fileRef = useRef(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name:         user?.name ?? '',
      timezone:     user?.timezone ?? 'UTC',
      baseCurrency: user?.baseCurrency ?? 'USD',
    },
  });

  const onSubmit = async (data) => {
    try {
      // Include current theme so Save Changes always persists it too
      const { data: res } = await axios.patch('/users/me', { ...data, theme });
      dispatch(updateUser(res.data));
      dispatch(toastSuccess('Profile saved.'));
    } catch (err) {
      dispatch(toastError(err.response?.data?.error?.message ?? 'Failed to save.'));
    }
  };

  // Toggle theme locally + persist to DB immediately (fire-and-forget)
  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    dispatch(setTheme(newTheme));
    axios.patch('/users/me', { theme: newTheme }).catch(() => {});
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    setAvatarLoading(true);
    try {
      const { data: res } = await axios.post('/uploads/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      dispatch(updateUser(res.data));
      dispatch(toastSuccess('Avatar updated.'));
    } catch {
      dispatch(toastError('Avatar upload failed.'));
    } finally {
      setAvatarLoading(false);
    }
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

      {/* Avatar */}
      <Section title="Profile Photo" desc="Click to upload a new photo (JPEG or PNG, max 5 MB).">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl overflow-hidden border-2 border-[var(--border)] bg-[var(--brand-indigo-subtle)]">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-xl font-bold" style={{ color: 'var(--brand-indigo)' }}>{initials}</span>
              )}
            </div>
            {avatarLoading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </div>
            )}
          </div>
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarUpload}
              id="avatar-upload"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={<Camera size={14} />}
              onClick={() => fileRef.current?.click()}
              disabled={avatarLoading}
            >
              {avatarLoading ? 'Uploading…' : 'Upload photo'}
            </Button>
          </div>
        </div>
      </Section>

      {/* Personal info */}
      <Section title="Personal Information">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" error={errors.name?.message}>
            <Input {...register('name')} placeholder="Your name" className="w-full" />
          </Field>
          <Field label="Email">
            <Input value={user?.email ?? ''} disabled className="w-full opacity-60" />
            <p className="mt-1 text-xs text-[var(--text-muted)]">Email cannot be changed.</p>
          </Field>
        </div>
      </Section>

      {/* Preferences */}
      <Section title="Preferences" desc="These affect how dates and amounts are displayed throughout the app.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Timezone" error={errors.timezone?.message}>
            <select
              {...register('timezone')}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-100)] px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-indigo)] transition-colors"
            >
              {TIMEZONES.map(tz => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </Field>
          <Field label="Base currency" error={errors.baseCurrency?.message}>
            <select
              {...register('baseCurrency')}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-100)] px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-indigo)] transition-colors"
            >
              {CURRENCIES.map(({ code, label }) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </select>
          </Field>
        </div>
      </Section>

      {/* Theme */}
      <Section title="Appearance">
        <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3">
          <div>
            <p className="text-sm font-medium text-[var(--text)]">
              {theme === 'dark' ? 'Dark mode' : 'Light mode'}
            </p>
            <p className="text-xs text-[var(--text-muted)]">Dark mode is on by default.</p>
          </div>
          <button
            type="button"
            onClick={handleThemeToggle}
            className={[
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              theme === 'dark' ? 'bg-[var(--brand-indigo)]' : 'bg-[var(--surface-300)]',
            ].join(' ')}
            role="switch"
            aria-checked={theme === 'dark'}
            aria-label="Toggle dark mode"
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </Section>

      <div className="flex justify-end">
        <Button type="submit" leftIcon={<Save size={15} />} disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Security Tab
// ═══════════════════════════════════════════════════════════════════════════════
const SecurityTab = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user     = useSelector(selectCurrentUser);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const hasLocalAuth  = user?.authProviders?.includes('local');
  const hasGoogleAuth = user?.authProviders?.includes('google');

  const schema = hasLocalAuth ? changePasswordSchema : setPasswordSchema;
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });
  const newPasswordValue = watch('newPassword', '');

  const onSubmit = async (data) => {
    try {
      const endpoint = hasLocalAuth ? '/users/me/change-password' : '/users/me/set-password';
      await axios.post(endpoint, {
        ...(hasLocalAuth ? { currentPassword: data.currentPassword } : {}),
        newPassword: data.newPassword,
      });
      reset();
      dispatch(toastSuccess(hasLocalAuth ? 'Password changed.' : 'Password set successfully.'));
    } catch (err) {
      dispatch(toastError(err.response?.data?.error?.message ?? 'Failed to update password.'));
    }
  };

  const handleLogoutAll = async () => {
    setLogoutLoading(true);
    try {
      await axios.post('/auth/logout-all');
      dispatch(logoutAction());           // clear Redux auth state
      navigate('/signin', { replace: true }); // redirect — session is gone
    } catch {
      dispatch(toastError('Could not sign out all devices. Try again.'));
      setLogoutLoading(false);
    }
  };

  return (
    <div className="space-y-8">

      {/* Linked providers */}
      <Section title="Sign-in Methods" desc="Auth providers currently linked to your account.">
        <div className="space-y-3">
          <div className={`flex items-center justify-between rounded-xl border p-4 ${hasLocalAuth ? 'border-[var(--border)] bg-[var(--surface-raised)]' : 'border-[var(--border)] bg-[var(--surface-100)] opacity-50'}`}>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                <span className="text-xs font-bold text-[var(--text)]">@</span>
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--text)]">Email & Password</p>
                <p className="text-xs text-[var(--text-muted)]">{hasLocalAuth ? 'Active' : 'Not set up'}</p>
              </div>
            </div>
            {hasLocalAuth && <CheckCircle2 size={16} style={{ color: 'var(--brand-indigo)' }} />}
          </div>

          <div className={`flex items-center justify-between rounded-xl border p-4 ${hasGoogleAuth ? 'border-[var(--border)] bg-[var(--surface-raised)]' : 'border-[var(--border)] bg-[var(--surface-100)] opacity-50'}`}>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                <span className="text-xs font-bold" style={{ color: '#4285F4' }}>G</span>
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--text)]">Google</p>
                <p className="text-xs text-[var(--text-muted)]">{hasGoogleAuth ? 'Linked' : 'Not linked'}</p>
              </div>
            </div>
            {hasGoogleAuth && <CheckCircle2 size={16} style={{ color: 'var(--brand-indigo)' }} />}
          </div>
        </div>
      </Section>

      {/* Password */}
      <Section
        title={hasLocalAuth ? 'Change Password' : 'Set a Password'}
        desc={hasLocalAuth
          ? 'Choose a strong password of at least 8 characters.'
          : 'Add a password to your Google account as a backup sign-in method.'
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-sm">
          {hasLocalAuth && (
            <Field label="Current password" error={errors.currentPassword?.message}>
              <div className="relative">
                <Input
                  {...register('currentPassword')}
                  type={showCurrent ? 'text' : 'password'}
                  placeholder="Current password"
                  className="w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(v => !v)}
                  aria-label={showCurrent ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)]"
                >
                  {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </Field>
          )}
          <Field label="New password" error={errors.newPassword?.message}>
            <div className="relative">
              <Input
                {...register('newPassword')}
                type={showNew ? 'text' : 'password'}
                placeholder="At least 8 characters"
                className="w-full pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew(v => !v)}
                aria-label={showNew ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <PasswordStrength password={newPasswordValue} />
          </Field>
          <Field label="Confirm new password" error={errors.confirmPassword?.message}>
            <Input
              {...register('confirmPassword')}
              type="password"
              placeholder="Repeat new password"
              className="w-full"
            />
          </Field>
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : hasLocalAuth ? 'Change password' : 'Set password'}
          </Button>
        </form>
      </Section>

      {/* Sessions */}
      <Section title="Active Sessions" desc="Sign out of all devices — useful if you think your account has been compromised.">
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<LogOut size={14} />}
          onClick={handleLogoutAll}
          disabled={logoutLoading}
        >
          {logoutLoading ? 'Signing out…' : 'Log out of all devices'}
        </Button>
      </Section>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Accounts Tab
// ═══════════════════════════════════════════════════════════════════════════════
const AccountsTab = () => {
  const dispatch = useDispatch();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]   = useState(null); // null = new account

  const fetchAccounts = async () => {
    try {
      const { data } = await axios.get('/accounts');
      setAccounts(data.data ?? []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAccounts(); }, []);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(accountSchema),
  });

  const openNew = () => {
    setEditing(null);
    reset({ name: '', broker: '', currency: 'USD', initialBalance: '' });
    setShowModal(true);
  };

  const openEdit = (acct) => {
    setEditing(acct);
    reset({
      name:           acct.name,
      broker:         acct.broker ?? '',
      currency:       acct.currency ?? 'USD',
      initialBalance: acct.initialBalance ?? '',
    });
    setShowModal(true);
  };

  const onSubmit = async (data) => {
    try {
      if (editing) {
        await axios.patch(`/accounts/${editing._id}`, data);
        dispatch(toastSuccess('Account updated.'));
      } else {
        await axios.post('/accounts', data);
        dispatch(toastSuccess('Account created.'));
      }
      setShowModal(false);
      fetchAccounts();
    } catch (err) {
      dispatch(toastError(err.response?.data?.error?.message ?? 'Failed to save account.'));
    }
  };

  const handleArchive = async (acct) => {
    try {
      await axios.patch(`/accounts/${acct._id}`, { isArchived: !acct.isArchived });
      dispatch(toastSuccess(acct.isArchived ? 'Account restored.' : 'Account archived.'));
      fetchAccounts();
    } catch {
      dispatch(toastError('Could not update account.'));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-[var(--text-muted)]">
            Manage your trading accounts. Each account tracks its own equity and trades independently.
          </p>
        </div>
        <Button size="sm" leftIcon={<Plus size={14} />} onClick={openNew}>
          Add account
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
        </div>
      ) : accounts.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] py-10 text-center text-sm text-[var(--text-muted)]">
          No accounts yet. Add your first trading account above.
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map(acct => (
            <div
              key={acct._id}
              className={`flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 ${acct.isArchived ? 'opacity-50' : ''}`}
            >
              <div>
                <p className="font-medium text-[var(--text)] text-sm">{acct.name}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {acct.broker && `${acct.broker} · `}{acct.currency ?? 'USD'}
                  {acct.isArchived && ' · Archived'}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(acct)}
                  aria-label={`Edit ${acct.name}`}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-200)] hover:text-[var(--text)] transition-colors"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => handleArchive(acct)}
                  aria-label={acct.isArchived ? `Restore ${acct.name}` : `Archive ${acct.name}`}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-200)] hover:text-[var(--text)] transition-colors"
                >
                  <Archive size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit account modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Edit Account' : 'Add Account'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Account name" error={errors.name?.message}>
            <Input {...register('name')} placeholder="e.g. Main Prop Account" className="w-full" />
          </Field>
          <Field label="Broker (optional)">
            <Input {...register('broker')} placeholder="e.g. FTMO, Interactive Brokers" className="w-full" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Currency" error={errors.currency?.message}>
              <select
                {...register('currency')}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-100)] px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-indigo)]"
              >
                {CURRENCIES.map(({ code }) => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
            </Field>
            <Field label="Starting balance" error={errors.initialBalance?.message}>
              <Input
                {...register('initialBalance')}
                type="number"
                step="0.01"
                placeholder="0.00"
                className="w-full"
              />
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : editing ? 'Save changes' : 'Create account'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Data Tab
// ═══════════════════════════════════════════════════════════════════════════════
const DataTab = () => {
  const dispatch = useDispatch();
  const [exporting, setExporting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const user = useSelector(selectCurrentUser);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data } = await axios.get('/users/me/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `tradiary-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      dispatch(toastSuccess('Export downloaded.'));
    } catch {
      dispatch(toastError('Export failed. Please try again.'));
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== user?.email) return;
    setDeleting(true);
    try {
      await axios.delete('/users/me');
      // Hard reload to clear all state
      window.location.href = '/';
    } catch {
      dispatch(toastError('Account deletion failed. Please try again.'));
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8">

      <Section title="Export Your Data" desc="Download all your trades, journal entries, and account data as a JSON file.">
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Download size={14} />}
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting ? 'Preparing export…' : 'Export all data (JSON)'}
        </Button>
      </Section>

      <Section title="Delete Account" desc="Permanently delete your account and all associated data. This action cannot be undone.">
        <div className="rounded-xl border border-[var(--loss)]/30 bg-[var(--loss-subtle)] p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" style={{ color: 'var(--loss)' }} />
            <div>
              <p className="text-sm font-medium text-[var(--text)]">This is permanent and irreversible</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Deletes your account, all trades, journal entries, playbooks, goals, and all other data immediately.
                In compliance with GDPR, no data is retained.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-4 text-[var(--loss-text)] hover:bg-[var(--loss-subtle)]"
            leftIcon={<Trash2 size={14} />}
            onClick={() => setShowDeleteModal(true)}
          >
            Delete my account
          </Button>
        </div>
      </Section>

      {/* Delete confirmation modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setDeleteConfirm(''); }}
        title="Delete Account"
      >
        <div className="space-y-5">
          <div className="rounded-xl border border-[var(--loss)]/30 bg-[var(--loss-subtle)] p-4 text-sm text-[var(--loss-text)]">
            <strong>Warning:</strong> This will permanently delete your account and all your data.
            This action cannot be undone.
          </div>

          <div>
            <p className="mb-2 text-sm text-[var(--text-muted)]">
              Type your email address to confirm: <strong className="text-[var(--text)]">{user?.email}</strong>
            </p>
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="Enter your email"
              className="w-full"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => { setShowDeleteModal(false); setDeleteConfirm(''); }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleDeleteAccount}
              disabled={deleteConfirm !== user?.email || deleting}
              className="bg-[var(--loss)] hover:opacity-90 text-white border-0"
            >
              {deleting ? 'Deleting…' : 'Delete my account'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Main SettingsPage
// ═══════════════════════════════════════════════════════════════════════════════
const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('profile');

  const tabContent = {
    profile:  <ProfileTab />,
    security: <SecurityTab />,
    accounts: <AccountsTab />,
    data:     <DataTab />,
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display text-[var(--text)]">Settings</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Manage your account, security, and preferences.</p>
      </div>

      {/* Tab bar — scrollable on mobile */}
      <div className="mb-8 flex gap-1 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            aria-selected={activeTab === id}
            role="tab"
            className={[
              'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-all',
              activeTab === id
                ? 'bg-[var(--surface)] text-[var(--text)] shadow-card'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]',
            ].join(' ')}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 animate-fade-in">
        {tabContent[activeTab]}
      </div>
    </div>
  );
};

export default SettingsPage;
