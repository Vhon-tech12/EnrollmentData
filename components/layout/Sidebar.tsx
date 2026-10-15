'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  Database,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  ScrollText,
  Settings,
  Users,
  UserSquare2,
} from 'lucide-react';
import { useRole, type RoleId } from '@/components/RoleProvider';

interface NavItem {
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
}

const NAV_CONFIG: Record<RoleId, NavItem[]> = {
  admin: [
    { label: 'Dashboard', path: 'dashboard', icon: LayoutDashboard },
    { label: 'Enrollment', path: 'enrollment', icon: Users },
    { label: 'Analytics', path: 'analytics', icon: BarChart3 },
    { label: 'Reports', path: 'reports', icon: FileText },
    { label: 'User Management', path: 'users', icon: UserSquare2 },
    { label: 'Reference Data', path: 'reference-data', icon: Database },
    { label: 'Activity Logs', path: 'activity-logs', icon: ScrollText },
    { label: 'Settings', path: 'settings', icon: Settings },
  ],
  registrar: [
    { label: 'Dashboard', path: 'dashboard', icon: LayoutDashboard },
    { label: 'Enrollment', path: 'enrollment', icon: Users },
    { label: 'Analytics', path: 'analytics', icon: BarChart3 },
    { label: 'Reports', path: 'reports', icon: FileText },
    { label: 'Settings', path: 'settings', icon: Settings },
  ],
  'school-admin': [
    { label: 'Dashboard', path: 'dashboard', icon: LayoutDashboard },
    { label: 'Analytics', path: 'analytics', icon: BarChart3 },
    { label: 'Reports', path: 'reports', icon: FileText },
    { label: 'Settings', path: 'settings', icon: Settings },
  ],
  'department-head': [
    { label: 'Dashboard', path: 'dashboard', icon: LayoutDashboard },
    { label: 'Analytics', path: 'analytics', icon: BarChart3 },
    { label: 'Reports', path: 'reports', icon: FileText },
    { label: 'Settings', path: 'settings', icon: Settings },
  ],
};

const ROLE_BASEPATH: Record<RoleId, string> = {
  admin: '/admin',
  registrar: '/registrar',
  'school-admin': '/school-admin',
  'department-head': '/department-head',
};

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role } = useRole();
  const basePath = ROLE_BASEPATH[role];
  const navItems = NAV_CONFIG[role];

  const handleLogout = () => {
    document.cookie = 'auth-session=; path=/; max-age=0; SameSite=Lax';
    try {
      sessionStorage.clear();
    } catch {
      // ignore
    }
    router.replace('/login?logout=1');
  };

  return (
    <div className="flex h-full flex-col bg-white dark:bg-slate-900">
      <div className="flex h-16 items-center gap-2.5 border-b border-slate-100 px-5 dark:border-slate-800">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
          <GraduationCap className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight text-slate-900 dark:text-slate-100">
            Enrollment Analytics
          </p>
          <p className="truncate text-[11px] leading-tight text-slate-500 dark:text-slate-400">
            Data &amp; Reporting System
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Main Menu
        </p>
        {navItems.map((item) => {
          const href = `${basePath}/${item.path}`;
          const active = pathname === href;
          const Icon = item.icon;
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${
                  active
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300'
                }`}
                strokeWidth={2}
              />
              <span className="truncate">{item.label}</span>
              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 p-3 dark:border-slate-800">
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
            {user.initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
              {user.name}
            </p>
            <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
              {user.roleLabel}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
}

export default function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:block">
      <SidebarContent />
    </aside>
  );
}