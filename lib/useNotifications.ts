'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { EnrollmentRecord } from './useEnrollments';

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  tone: 'info' | 'success' | 'warning' | 'danger';
  read: boolean;
}

const READ_STORAGE_KEY = 'notifications-read-ids';

function getReadIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(READ_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveReadIds(ids: string[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(ids));
}

function timeAgo(dateStr: string): string {
  // Parse "Aug 15, 2025" style date
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
}

export function useNotifications(records: EnrollmentRecord[]) {
  const [readIds, setReadIds] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setReadIds(getReadIds());
    setMounted(true);
  }, []);

  // Generate notifications from recent enrollment records
  const notifications = useMemo<Notification[]>(() => {
    if (records.length === 0) return [];

    // Sort by dateEnrolled descending
    const sorted = [...records].sort((a, b) => {
      const dateA = new Date(a.dateEnrolled).getTime() || 0;
      const dateB = new Date(b.dateEnrolled).getTime() || 0;
      return dateB - dateA;
    });

    // Take the 10 most recent and generate notifications
    return sorted.slice(0, 10).map((r) => {
      const time = timeAgo(r.dateEnrolled);
      const isRead = readIds.includes(r.id);

      if (r.status === 'Pending') {
        return {
          id: r.id,
          title: 'Pending enrollment',
          message: `${r.studentName} (${r.program}) is awaiting verification.`,
          time,
          tone: 'warning' as const,
          read: isRead,
        };
      }
      if (r.status === 'Cancelled') {
        return {
          id: r.id,
          title: 'Enrollment cancelled',
          message: `${r.studentName} (${r.program}) has been cancelled.`,
          time,
          tone: 'danger' as const,
          read: isRead,
        };
      }
      return {
        id: r.id,
        title: 'New enrollment',
        message: `${r.studentName} enrolled in ${r.program} — ${r.yearLevel}, Section ${r.section}.`,
        time,
        tone: 'success' as const,
        read: isRead,
      };
    });
  }, [records, readIds]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const markAsRead = useCallback((id: string) => {
    setReadIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      saveReadIds(next);
      return next;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    const allIds = notifications.map((n) => n.id);
    const merged = Array.from(new Set([...readIds, ...allIds]));
    saveReadIds(merged);
    setReadIds(merged);
  }, [notifications, readIds]);

  return {
    notifications: mounted ? notifications : [],
    unreadCount: mounted ? unreadCount : 0,
    markAsRead,
    markAllAsRead,
  };
}