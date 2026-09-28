/**
 * components/layout/Sidebar.jsx
 * Collapsible left navigation sidebar.
 * Reads collapsed state from Redux and toggles via uiSlice.
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  BarChart3,
  BookMarked,
  Settings,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { toggleSidebar, selectSidebarCollapsed } from '@/features/ui/uiSlice';

const NAV_ITEMS = [
  { to: '/app/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/app/trades',     label: 'Trades',      icon: BookOpen },
  { to: '/app/calendar',   label: 'Calendar',    icon: CalendarDays },
  { to: '/app/analytics',  label: 'Analytics',   icon: BarChart3 },
  { to: '/app/playbooks',  label: 'Playbooks',   icon: BookMarked },
  { to: '/app/settings',   label: 'Settings',    icon: Settings },
];

const NavItem = ({ to, label, icon: Icon, collapsed }) => (
  <NavLink
    to={to}
    title={collapsed ? label : undefined}
    className={({ isActive }) =>
      [
        'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
        'transition-all duration-[150ms]',
        isActive
          ? 'bg-[var(--color-brand-subtle)] text-[var(--color-brand)]'
          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-100)] hover:text-[var(--color-text-primary)]',
      ].join(' ')
    }
  >
    <Icon
      size={18}
      className="shrink-0 transition-transform duration-150 group-hover:scale-110"
    />
    {!collapsed && (
      <span className="truncate animate-fade-in">{label}</span>
    )}
  </NavLink>
);

const Sidebar = () => {
  const dispatch = useDispatch();
  const collapsed = useSelector(selectSidebarCollapsed);

  return (
    <aside
      className={[
        'fixed inset-y-0 left-0 z-40 flex flex-col',
        'border-r border-[var(--color-border)] bg-[var(--color-surface)]',
        'transition-[width] duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-[240px]',
      ].join(' ')}
    >
      {/* ── Logo ── */}
      <div className="flex h-[60px] items-center border-b border-[var(--color-border)] px-4">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-brand)] shadow-glow">
            <TrendingUp size={16} className="text-white" />
          </div>
          {!collapsed && (
            <span className="text-base font-bold tracking-tight text-[var(--color-text-primary)] animate-fade-in">
              Tradiary
            </span>
          )}
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-4">
        <div className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.to} {...item} collapsed={collapsed} />
          ))}
        </div>
      </nav>

      {/* ── Collapse Toggle ── */}
      <div className="border-t border-[var(--color-border)] p-2">
        <button
          id="sidebar-toggle"
          onClick={() => dispatch(toggleSidebar())}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={[
            'flex w-full items-center rounded-lg px-3 py-2.5 text-sm',
            'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-100)] hover:text-[var(--color-text-primary)]',
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
