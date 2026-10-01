/**
 * components/layout/Topbar.jsx
 * App topbar: Logo on mobile, page title, notification bell, theme toggle, user menu.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { Sun, Moon, LogOut, Settings, ChevronDown, Plus } from 'lucide-react';
import { toggleTheme, selectTheme } from '@/features/ui/uiSlice';
import { logout, selectCurrentUser } from '@/features/auth/authSlice';
import { toastSuccess } from '@/features/ui/toastSlice';
import NotificationBell from '@/components/notifications/NotificationBell';
import Logo from '@/components/ui/Logo';

const Topbar = ({ onNewTrade }) => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const theme     = useSelector(selectTheme);
  const user      = useSelector(selectCurrentUser);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef   = useRef(null);

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
    <header className="sticky top-0 z-30 flex h-[60px] items-center justify-between gap-4 border-b border-[var(--border)] bg-[var(--surface)]/80 px-4 backdrop-blur-sm">

      {/* Left: Logo on mobile, empty on desktop (sidebar has it) */}
      <div className="flex items-center gap-3 lg:hidden">
        <Link to="/app/dashboard" aria-label="Dashboard">
          <Logo variant="icon" size={28} />
        </Link>
      </div>
      {/* Desktop spacer */}
      <div className="hidden lg:block flex-1" />

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        {/* Log Trade shortcut button */}
        {onNewTrade && (
          <button
            id="topbar-new-trade-btn"
            onClick={onNewTrade}
            title="Log a Trade  (N)"
            aria-label="Log a new trade — keyboard shortcut: N"
            className="hidden sm:flex items-center gap-1.5 rounded-lg bg-[var(--brand-indigo)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-all mr-1"
          >
            <Plus size={13} /> Log Trade
            <kbd className="ml-1 rounded border border-white/30 bg-white/10 px-1 py-0.5 text-[10px] font-mono">N</kbd>
          </button>
        )}

        {/* Theme toggle */}
        <button
          id="theme-toggle"
          onClick={() => dispatch(toggleTheme())}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-100)] hover:text-[var(--text)] transition-all"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notifications */}
        <NotificationBell />

        {/* User menu */}
        <div ref={menuRef} className="relative ml-1">
          <button
            id="user-menu-btn"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[var(--surface-100)] transition-all"
          >
            {/* Avatar */}
            <div className="flex h-7 w-7 items-center justify-center rounded-full overflow-hidden border border-[var(--border)] bg-[var(--brand-indigo-subtle)]">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs font-semibold" style={{ color: 'var(--brand-indigo)' }}>{initials}</span>
              )}
            </div>
            <span className="hidden sm:block max-w-[100px] truncate text-sm text-[var(--text-muted)]">
              {user?.name ?? 'Account'}
            </span>
            <ChevronDown
              size={14}
              className={`text-[var(--text-muted)] transition-transform ${menuOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-1 w-52 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-card-hover animate-fade-in z-50"
            >
              <div className="border-b border-[var(--border)] px-4 py-3">
                <p className="text-sm font-medium text-[var(--text)] truncate">{user?.name}</p>
                <p className="text-xs text-[var(--text-muted)] truncate">{user?.email}</p>
              </div>
              <div className="p-1" role="none">
                <Link
                  to="/app/settings"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--surface-100)] hover:text-[var(--text)] transition-all"
                >
                  <Settings size={14} />
                  Settings
                </Link>
                <button
                  id="topbar-logout-btn"
                  role="menuitem"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--loss-subtle)] hover:text-[var(--loss-text)] transition-all"
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
