/**
 * components/layout/Sidebar.jsx
 * Collapsible left navigation sidebar with Logo component.
 * Full lockup when expanded, icon-only when collapsed.
 * Hidden on mobile (MobileNav handles those viewports).
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  BookMarked,
  Settings,
  ChevronLeft,
  ChevronRight,
  NotebookPen,
  Target,
  AlertOctagon,
  Eye,
  Calculator,
} from 'lucide-react';
import { toggleSidebar, selectSidebarCollapsed } from '@/features/ui/uiSlice';
import Logo from '@/components/ui/Logo';

const NAV_SECTIONS = [
  {
    label: 'Trading',
    items: [
      { to: '/app/dashboard',  label: 'Dashboard',   icon: LayoutDashboard },
      { to: '/app/trades',     label: 'Trades',       icon: BookOpen },
      { to: '/app/calendar',   label: 'Calendar',     icon: CalendarDays },
      { to: '/app/playbooks',  label: 'Playbooks',    icon: BookMarked },
    ],
  },
  {
    label: 'Insights',
    items: [
      { to: '/app/journal',    label: 'Journal',      icon: NotebookPen },
      { to: '/app/goals',      label: 'Goals',        icon: Target },
      { to: '/app/mistakes',   label: 'Mistakes',     icon: AlertOctagon },
      { to: '/app/watchlist',  label: 'Watchlist',    icon: Eye },
    ],
  },
  {
    label: 'Tools',
    items: [
      { to: '/app/tools/risk-calculator', label: 'Risk Calc', icon: Calculator },
      { to: '/app/settings',              label: 'Settings',   icon: Settings },
    ],
  },
];

const NavItem = ({ to, label, icon: Icon, collapsed }) => (
  <NavLink
    to={to}
    title={collapsed ? label : undefined}
    className={({ isActive }) =>
      [
        'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
        'transition-all duration-[150ms]',
        isActive
          ? 'bg-[var(--brand-indigo-subtle)] text-[var(--brand-indigo)]'
          : 'text-[var(--text-muted)] hover:bg-[var(--surface-100)] hover:text-[var(--text)]',
      ].join(' ')
    }
  >
    <Icon
      size={17}
      className="shrink-0 transition-transform duration-150 group-hover:scale-110"
    />
    {!collapsed && (
      <span className="truncate animate-fade-in">{label}</span>
    )}
  </NavLink>
);

const Sidebar = () => {
  const dispatch  = useDispatch();
  const collapsed = useSelector(selectSidebarCollapsed);

  return (
    <aside
      className={[
        'fixed inset-y-0 left-0 z-40 flex flex-col',
        'border-r border-[var(--border)] bg-[var(--surface)]',
        'transition-[width] duration-300 ease-in-out',
        // Hidden on mobile — MobileNav takes over
        'hidden lg:flex',
        collapsed ? 'w-16' : 'w-[240px]',
      ].join(' ')}
    >
      {/* ── Logo ── */}
      <div className="flex h-[60px] items-center border-b border-[var(--border)] px-4">
        {collapsed ? (
          <Logo variant="icon" size={28} />
        ) : (
          <Logo variant="full" size={28} className="animate-fade-in" />
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3">
        <div className="flex flex-col gap-4">
          {NAV_SECTIONS.map(section => (
            <div key={section.label}>
              {!collapsed && (
                <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                  {section.label}
                </p>
              )}
              <div className="flex flex-col gap-0.5">
                {section.items.map(item => (
                  <NavItem key={item.to} {...item} collapsed={collapsed} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* ── Collapse Toggle ── */}
      <div className="border-t border-[var(--border)] p-2">
        <button
          id="sidebar-toggle"
          onClick={() => dispatch(toggleSidebar())}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={[
            'flex w-full items-center rounded-lg px-3 py-2 text-sm',
            'text-[var(--text-muted)] hover:bg-[var(--surface-100)] hover:text-[var(--text)]',
            'transition-all duration-150',
            collapsed ? 'justify-center' : 'gap-3',
          ].join(' ')}
        >
          {collapsed ? <ChevronRight size={16} /> : (
            <>
              <ChevronLeft size={16} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
