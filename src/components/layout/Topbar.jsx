/**
 * components/layout/Topbar.jsx  (updated)
 * Theme toggle, notification bell, user menu with logout.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, Bell, LogOut, User, ChevronDown } from 'lucide-react';
import { toggleTheme, selectTheme } from '@/features/ui/uiSlice';
import { logout, selectCurrentUser } from '@/features/auth/authSlice';
import { toastSuccess } from '@/features/ui/toastSlice';

const Topbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useSelector(selectTheme);
  const user = useSelector(selectCurrentUser);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    setMenuOpen(false);
    await dispatch(logout());
    dispatch(toastSuccess('Signed out successfully.'));
    navigate('/signin');
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <header className="sticky top-0 z-30 flex h-[60px] items-center justify-between gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 px-6 backdrop-blur-sm">
      {/* Left breadcrumb placeholder */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm text-[var(--color-text-muted)] truncate" />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5">
        {/* Theme toggle */}
        <button
          id="theme-toggle"
          onClick={() => dispatch(toggleTheme())}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-200)] hover:text-[var(--color-text-primary)] transition-all"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notifications */}
        <button
          id="notifications-btn"
          title="Notifications"
          className="relative flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-200)] hover:text-[var(--color-text-primary)] transition-all"
        >
          <Bell size={16} />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--color-brand)]" />
        </button>

        {/* User menu */}
        <div ref={menuRef} className="relative">
          <button
            id="user-menu-btn"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[var(--color-surface-200)] transition-all"
          >
            {/* Avatar */}
            <div className="flex h-7 w-7 items-center justify-center rounded-full overflow-hidden border border-[var(--color-border)] bg-[var(--color-brand-subtle)]">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs font-semibold text-[var(--color-brand)]">{initials}</span>
              )}
            </div>
            <span className="hidden sm:block max-w-[100px] truncate text-sm text-[var(--color-text-secondary)]">
              {user?.name ?? 'Account'}
            </span>
            <ChevronDown size={14} className={`text-[var(--color-text-muted)] transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-52 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-card animate-fade-in z-50">
              <div className="border-b border-[var(--color-border)] px-4 py-3">
                <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{user?.name}</p>
                <p className="text-xs text-[var(--color-text-muted)] truncate">{user?.email}</p>
              </div>
              <div className="p-1">
                <button
                  id="topbar-logout-btn"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-loss-subtle)] hover:text-[var(--color-loss-text)] transition-all"
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
