'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Menu,
  Search,
  CheckCheck,
  X,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useRole } from '@/components/RoleProvider';
import { useEnrollments } from '@/lib/useEnrollments';
import { useNotifications, type Notification } from '@/lib/useNotifications';
import Link from 'next/link';

interface HeaderProps {
  onMenuClick?: () => void;
}

const TONE_CONFIG: Record<
  Notification['tone'],
  { icon: typeof Bell; color: string; bg: string }
> = {
  success: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  warning: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
  danger: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  info: { icon: Bell, color: 'text-blue-600', bg: 'bg-blue-50' },
};

export default function Header({ onMenuClick }: HeaderProps) {
  const { user } = useRole();
  const { records } = useEnrollments();
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications(records);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [open]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) {
      document.addEventListener('keydown', handleKey);
      return () => document.removeEventListener('keydown', handleKey);
    }
  }, [open]);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-slate-900/85">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold text-slate-900 dark:text-slate-100 sm:text-lg">
            Dashboard
          </h1>
          <p className="hidden truncate text-xs text-slate-500 dark:text-slate-400 sm:block">
            Enrollment overview and key statistics
          </p>
        </div>

        <div className="relative hidden xl:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="search"
            placeholder="Search students, programs, reports…"
            className="h-10 w-72 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 transition-colors focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:bg-slate-800"
          />
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-label="Notifications"
            className="relative rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900 sm:w-96">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-950/60 dark:text-red-400">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                      <Bell className="h-5 w-5" />
                    </span>
                    <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                      No notifications
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      You're all caught up.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                    {notifications.map((n) => {
                      const cfg = TONE_CONFIG[n.tone];
                      const Icon = cfg.icon;
                      return (
                        <li key={n.id}>
                          <button
                            type="button"
                            onClick={() => markAsRead(n.id)}
                            className={`group flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                              !n.read ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                            }`}
                          >
                            <span
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${cfg.bg} ${cfg.color} dark:bg-opacity-20`}
                            >
                              <Icon className="h-4 w-4" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p
                                  className={`truncate text-xs font-semibold ${
                                    n.read
                                      ? 'text-slate-700 dark:text-slate-300'
                                      : 'text-slate-900 dark:text-slate-100'
                                  }`}
                                >
                                  {n.title}
                                </p>
                                {!n.read && (
                                  <span className="h-2 w-2 shrink-0 rounded-full bg-blue-600 dark:bg-blue-400" />
                                )}
                              </div>
                              <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-500 dark:text-slate-400">
                                {n.message}
                              </p>
                              <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                                {n.time}
                              </p>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="border-t border-slate-100 bg-slate-50 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-800/50">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      disabled={unreadCount === 0}
                      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-blue-600 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-slate-400 dark:text-blue-400 dark:hover:bg-blue-950/40"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      Mark all as read
                    </button>
                    <Link
                      href={`/${user.role === 'admin' ? 'admin' : user.role === 'registrar' ? 'registrar' : user.role === 'department-head' ? 'department-head' : 'admin'}/enrollment`}
                      onClick={() => setOpen(false)}
                      className="text-[11px] font-medium text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                      View all
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white py-1.5 pl-1.5 pr-3 dark:border-slate-700 dark:bg-slate-800">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-[11px] font-semibold text-white">
            {user.initials}
          </span>
          <div className="hidden text-left sm:block">
            <p className="max-w-[140px] truncate text-xs font-semibold leading-tight text-slate-900 dark:text-slate-100">
              {user.name}
            </p>
            <p className="max-w-[140px] truncate text-[11px] leading-tight text-slate-500 dark:text-slate-400">
              {user.roleLabel}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}