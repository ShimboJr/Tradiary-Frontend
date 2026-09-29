/**
 * components/layout/MobileNav.jsx
 * Bottom tab bar shown on mobile (< lg). Mirrors the top 4 nav items.
 * The "More" button opens a slide-up drawer with the rest.
 */

import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  Menu,
  X,
  BookMarked,
  NotebookPen,
  Target,
  AlertOctagon,
  Eye,
  Calculator,
  Settings,
} from 'lucide-react';
import Logo from '@/components/ui/Logo';

const BOTTOM_TABS = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/trades',    label: 'Trades',    icon: BookOpen },
  { to: '/app/calendar',  label: 'Calendar',  icon: CalendarDays },
];

const DRAWER_ITEMS = [
  { to: '/app/playbooks',           label: 'Playbooks',    icon: BookMarked },
  { to: '/app/journal',             label: 'Journal',      icon: NotebookPen },
  { to: '/app/goals',               label: 'Goals',        icon: Target },
  { to: '/app/mistakes',            label: 'Mistakes',     icon: AlertOctagon },
  { to: '/app/watchlist',           label: 'Watchlist',    icon: Eye },
  { to: '/app/tools/risk-calculator', label: 'Risk Calc', icon: Calculator },
  { to: '/app/settings',            label: 'Settings',     icon: Settings },
];

const MobileNav = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      {/* ── Bottom Tab Bar ── */}
      <nav className="fixed bottom-0 inset-x-0 z-50 flex lg:hidden border-t border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-sm">
        {BOTTOM_TABS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                'flex flex-1 flex-col items-center justify-center gap-1 py-3 text-[10px] font-medium transition-colors',
                isActive
                  ? 'text-[var(--brand-indigo)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} />
                <span>{label}</span>
                {isActive && (
                  <span className="absolute bottom-0 h-0.5 w-8 rounded-full bg-[var(--brand-indigo)]" />
                )}
              </>
            )}
          </NavLink>
        ))}

        {/* More button */}
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="More navigation options"
          className={[
            'flex flex-1 flex-col items-center justify-center gap-1 py-3 text-[10px] font-medium',
            drawerOpen ? 'text-[var(--brand-indigo)]' : 'text-[var(--text-muted)]',
            'transition-colors',
          ].join(' ')}
        >
          <Menu size={20} />
          <span>More</span>
        </button>
      </nav>

      {/* ── Drawer Overlay ── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          onClick={() => setDrawerOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Drawer */}
          <div
            className="absolute bottom-0 inset-x-0 rounded-t-2xl border-t border-[var(--border)] bg-[var(--surface)] animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer handle + header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <Logo variant="full" size={24} />
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-100)] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer items */}
            <div className="grid grid-cols-2 gap-2 p-4">
              {DRAWER_ITEMS.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setDrawerOpen(false)}
                  className={({ isActive }) =>
                    [
                      'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all',
                      isActive
                        ? 'bg-[var(--brand-indigo-subtle)] text-[var(--brand-indigo)]'
                        : 'text-[var(--text-muted)] hover:bg-[var(--surface-100)] hover:text-[var(--text)]',
                    ].join(' ')
                  }
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>

            {/* Safe area spacer */}
            <div className="h-6" />
          </div>
        </div>
      )}
    </>
  );
};

export default MobileNav;
