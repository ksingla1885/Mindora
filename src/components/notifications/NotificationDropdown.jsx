'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Trophy, CheckCircle2, Gift, Megaphone, X, CheckCheck, Loader2 } from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns a Lucide icon component based on the notification type string.
 */
function getNotificationIcon(type) {
  switch (type) {
    case 'BADGE_AWARDED':
    case 'BADGE_UNLOCKED':
      return <Trophy className="h-4 w-4 text-yellow-500" />;
    case 'REWARD_AWARDED':
      return <Gift className="h-4 w-4 text-purple-500" />;
    case 'DPP_QUESTION_CORRECT':
    case 'DPP_COMPLETED':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    default:
      return <Megaphone className="h-4 w-4 text-blue-400" />;
  }
}

/**
 * Formats a UTC date string into a human-readable relative time label.
 */
function timeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffSecs = Math.floor((now - date) / 1000);

  if (diffSecs < 60) return 'Just now';
  if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
  if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
  if (diffSecs < 604800) return `${Math.floor(diffSecs / 86400)}d ago`;
  return date.toLocaleDateString();
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const dropdownRef = useRef(null);
  const pollIntervalRef = useRef(null);

  // ── Data fetching ────────────────────────────────────────────────────────────

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=20');
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // silently fail — UI stays stale
    }
  }, []);

  // Initial load + poll every 60 s to keep badge fresh
  useEffect(() => {
    fetchNotifications();
    pollIntervalRef.current = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(pollIntervalRef.current);
  }, [fetchNotifications]);

  // Refresh when the dropdown is opened
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchNotifications().finally(() => setLoading(false));
    }
  }, [isOpen, fetchNotifications]);

  // ── Click-outside to close ───────────────────────────────────────────────────

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // ── Actions ──────────────────────────────────────────────────────────────────

  const markAsRead = useCallback(async (id) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
    } catch {
      // revert on failure
      fetchNotifications();
    }
  }, [fetchNotifications]);

  const deleteNotification = useCallback(async (e, id) => {
    e.stopPropagation();
    const wasUnread = notifications.find((n) => n.id === id)?.read === false;

    // Optimistic update
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (wasUnread) setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
    } catch {
      fetchNotifications();
    }
  }, [notifications, fetchNotifications]);

  const markAllRead = useCallback(async () => {
    setMarkingAll(true);
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);

    try {
      await fetch('/api/notifications/mark-all-read', { method: 'POST' });
    } catch {
      fetchNotifications();
    } finally {
      setMarkingAll(false);
    }
  }, [fetchNotifications]);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        id="notification-bell-btn"
        aria-label="Open notifications"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative rounded-full bg-[#f0f2f4] p-2 text-[#616f89] hover:text-primary transition-colors dark:bg-[#1f2937] dark:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        suppressHydrationWarning
      >
        <Bell className="h-5 w-5" />

        {/* Badge */}
        {unreadCount > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-card"
            aria-label={`${unreadCount} unread notifications`}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className="
            absolute right-0 top-[calc(100%+10px)] z-50
            w-[360px] max-h-[480px]
            flex flex-col
            rounded-2xl border border-border bg-card shadow-2xl
            animate-in fade-in slide-in-from-top-2 duration-200
          "
          role="dialog"
          aria-label="Notifications"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
              {unreadCount > 0 && (
                <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                disabled={markingAll}
                title="Mark all as read"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
              >
                {markingAll ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCheck className="h-3.5 w-3.5" />
                )}
                Mark all read
              </button>
            )}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/50">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-xs">Loading notifications…</p>
              </div>
            ) : notifications.length === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center py-14 px-4 text-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Bell className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">You're all caught up! 🎉</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    No new notifications right now.
                  </p>
                </div>
              </div>
            ) : (
              notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={markAsRead}
                  onDelete={deleteNotification}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="shrink-0 border-t border-border px-4 py-2.5 text-center">
              <p className="text-xs text-muted-foreground">
                Showing latest {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Notification Item ────────────────────────────────────────────────────────

function NotificationItem({ notification, onRead, onDelete }) {
  const { id, type, title, message, read, createdAt } = notification;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => !read && onRead(id)}
      onKeyDown={(e) => e.key === 'Enter' && !read && onRead(id)}
      className={`
        group relative flex items-start gap-3 px-4 py-3
        cursor-pointer transition-colors duration-150
        ${read
          ? 'bg-card hover:bg-accent/30'
          : 'bg-primary/5 hover:bg-primary/10'
        }
      `}
    >
      {/* Unread indicator dot */}
      {!read && (
        <span className="absolute left-2 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
      )}

      {/* Icon */}
      <div className={`
        flex h-8 w-8 shrink-0 items-center justify-center rounded-full
        ${read ? 'bg-muted' : 'bg-primary/10'}
      `}>
        {getNotificationIcon(type)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug truncate ${read ? 'text-muted-foreground font-normal' : 'text-foreground font-semibold'}`}>
          {title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
          {message}
        </p>
        <p className="mt-1 text-[10px] text-muted-foreground/70">
          {timeAgo(createdAt)}
        </p>
      </div>

      {/* Delete button (visible on hover) */}
      <button
        onClick={(e) => onDelete(e, id)}
        aria-label="Dismiss notification"
        className="
          shrink-0 mt-0.5 opacity-0 group-hover:opacity-100
          rounded-full p-0.5 text-muted-foreground hover:text-foreground
          transition-all duration-150
        "
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
