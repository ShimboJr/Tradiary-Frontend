/**
 * components/notifications/NotificationBell.jsx
 * Topbar notification bell icon with unread badge and dropdown panel.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Bell, CheckCheck, TrendingUp, Target, Award, BarChart2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  selectNotifications,
  selectUnreadCount,
  selectNotificationsStatus,
} from '@/features/notifications/notificationsSlice';

// Map notification type to an icon
const TYPE_ICONS = {
  weekly_summary: BarChart2,
  streak_break:   TrendingUp,
  goal_achieved:  Award,
  default:        Target,
};

const NotifIcon = ({ type }) => {
  const Icon = TYPE_ICONS[type] ?? TYPE_ICONS.default;
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-indigo-subtle)]">
      <Icon size={15} style={{ color: 'var(--brand-indigo)' }} />
    </div>
  );
};

const NotificationBell = () => {
  const dispatch  = useDispatch();
  const items     = useSelector(selectNotifications);
  const unread    = useSelector(selectUnreadCount);
  const status    = useSelector(selectNotificationsStatus);
  const [open, setOpen] = useState(false);
  const panelRef  = useRef(null);

  // Fetch on mount
  useEffect(() => {
    if (status === 'idle') dispatch(fetchNotifications());
  }, [dispatch, status]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    setOpen(v => !v);
  };

  const handleMarkRead = (id) => {
    dispatch(markNotificationRead(id));
  };

  const handleMarkAll = () => {
    dispatch(markAllNotificationsRead());
  };

  return (
    <div ref={panelRef} className="relative">
      <button
        id="notifications-btn"
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
        onClick={handleOpen}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-100)] hover:text-[var(--text)] transition-all"
      >
        <Bell size={16} />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--brand-indigo)] text-[9px] font-bold text-white leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-card-hover animate-fade-in z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <span className="text-sm font-semibold text-[var(--text)]">Notifications</span>
            {unread > 0 && (
              <button
                onClick={handleMarkAll}
                className="flex items-center gap-1 text-xs text-[var(--brand-indigo)] hover:underline"
                aria-label="Mark all notifications as read"
              >
                <CheckCheck size={13} />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-[var(--border)]">
            {status === 'loading' && (
              <div className="p-6 text-center text-sm text-[var(--text-muted)]">Loading…</div>
            )}
            {status !== 'loading' && items.length === 0 && (
              <div className="p-6 text-center">
                <Bell size={24} className="mx-auto mb-2 opacity-30 text-[var(--text-muted)]" />
                <p className="text-sm text-[var(--text-muted)]">No notifications yet.</p>
              </div>
            )}
            {items.map((n) => (
              <div
                key={n._id}
                className={[
                  'flex items-start gap-3 px-4 py-3 transition-colors cursor-default',
                  !n.read ? 'bg-[var(--brand-indigo-subtle)]' : 'hover:bg-[var(--surface-100)]',
                ].join(' ')}
                onClick={() => !n.read && handleMarkRead(n._id)}
                role={!n.read ? 'button' : undefined}
                tabIndex={!n.read ? 0 : undefined}
                onKeyDown={(e) => e.key === 'Enter' && !n.read && handleMarkRead(n._id)}
              >
                <NotifIcon type={n.type} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${!n.read ? 'text-[var(--text)] font-medium' : 'text-[var(--text-muted)]'}`}>
                    {n.title}
                  </p>
                  {n.body && (
                    <p className="mt-0.5 text-xs text-[var(--text-muted)] line-clamp-2">{n.body}</p>
                  )}
                  <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </p>
                </div>
                {!n.read && (
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--brand-indigo)]" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
