'use client';

import { useState, useMemo } from 'react';
import {
  ScrollText,
  Search,
  LogIn,
  UserPlus,
  FileEdit,
  FileText,
  Download,
  AlertCircle,
  CheckCircle2,
  Filter,
  RefreshCw,
  Inbox,
  Database,
} from 'lucide-react';
import { useActivityLogs, type ActivityLog } from '@/lib/useActivityLogs';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Badge, { type BadgeTone } from '@/components/ui/Badge';

type ActivityStatus = 'Success' | 'Warning' | 'Failed';

const STATUS_TONE: Record<ActivityStatus, BadgeTone> = {
  Success: 'success',
  Warning: 'warning',
  Failed: 'danger',
};

// 🛠️ Updated with dark mode variants
const MODULE_TONE: Record<string, string> = {
  Authentication:
    'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400',
  Enrollment:
    'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
  Reports:
    'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400',
  'User Management':
    'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
  'Reference Data':
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  Analytics:
    'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400',
  Settings:
    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

const MODULE_ICON: Record<string, typeof LogIn> = {
  Authentication: LogIn,
  Enrollment: FileEdit,
  Reports: FileText,
  'User Management': UserPlus,
  'Reference Data': Database,
  Analytics: AlertCircle,
  Settings: AlertCircle,
};

interface FilterState {
  search: string;
  module: string;
  status: string;
}

const EMPTY_FILTERS: FilterState = {
  search: '',
  module: '',
  status: '',
};

// 🛠️ Updated with dark mode
const SELECT_CLASS =
  'h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 transition-colors hover:bg-slate-50 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:focus:border-blue-500 dark:focus:ring-blue-500/20';

// Format ISO timestamp → "Feb 18, 2026 · 08:42 AM"
function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const date = d.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
    const time = d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${date} · ${time}`;
  } catch {
    return iso;
  }
}

function relativeTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const diff = Date.now() - d.getTime();
    const min = Math.floor(diff / 60000);
    const hr = Math.floor(min / 60);
    const day = Math.floor(hr / 24);
    if (min < 1) return 'Just now';
    if (min < 60) return `${min}m ago`;
    if (hr < 24) return `${hr}h ago`;
    if (day < 7) return `${day}d ago`;
    return '';
  } catch {
    return '';
  }
}

export default function ActivityLogsPage() {
  const { logs, loading, error, refetch } = useActivityLogs();
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);

  const update = (key: keyof FilterState, value: string) =>
    setFilters({ ...filters, [key]: value });

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const q = filters.search.toLowerCase();
      const matchesSearch =
        !q ||
        log.user.toLowerCase().includes(q) ||
        log.activity.toLowerCase().includes(q) ||
        log.role.toLowerCase().includes(q);
      return (
        matchesSearch &&
        (!filters.module || log.module === filters.module) &&
        (!filters.status || log.status === filters.status)
      );
    });
  }, [logs, filters]);

  const hasActiveFilters = Boolean(
    filters.search || filters.module || filters.status,
  );

  const stats = useMemo(() => {
    return {
      total: logs.length,
      success: logs.filter((l) => l.status === 'Success').length,
      warning: logs.filter((l) => l.status === 'Warning').length,
      failed: logs.filter((l) => l.status === 'Failed').length,
    };
  }, [logs]);

  const uniqueModules = useMemo(() => {
    return Array.from(new Set(logs.map((l) => l.module))).sort();
  }, [logs]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:border dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400">
            <ScrollText className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Activity Logs
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Monitor user activity and system events across all modules.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={refetch}
          disabled={loading}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Info banner */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-500/30 dark:bg-blue-500/10">
        <p className="text-xs text-blue-800 dark:text-blue-300/80">
          <span className="font-semibold dark:text-blue-200">Audit trail:</span> Activity logs are
          automatically recorded when users perform actions in the system.
          Ang logs ay read-only at hindi maaaring i-edit o i-delete — para sa
          security at compliance purposes.
        </p>
      </div>

      {/* Stat tiles */}
      {!loading && logs.length > 0 && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile label="Total Events" value={stats.total} />
          <StatTile
            label="Success"
            value={stats.success}
            tone="text-emerald-600 dark:text-emerald-400"
          />
          <StatTile
            label="Warnings"
            value={stats.warning}
            tone="text-amber-600 dark:text-amber-400"
          />
          <StatTile
            label="Failed"
            value={stats.failed}
            tone="text-red-600 dark:text-red-400"
          />
        </div>
      )}

      {/* Loading */}
      {loading && (
        <Card className="shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <CardBody>
            <div className="flex items-center justify-center gap-3 py-12">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600 dark:border-blue-900 dark:border-t-blue-500" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Loading activity logs…
              </p>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Error */}
      {error && !loading && (
        <Card className="shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <CardBody>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-8 w-8 text-red-500 dark:text-red-400" />
              <p className="mt-3 text-sm font-medium text-slate-800 dark:text-slate-200">
                Failed to load activity logs
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {error}
              </p>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Empty state */}
      {!loading && !error && logs.length === 0 && (
        <Card className="shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <CardBody>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <Inbox className="h-7 w-7 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
                No activity logs yet
              </h3>
              <p className="mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400">
                Activity logs will appear here automatically as users perform
                actions in the system — logging in, adding enrollment records,
                updating reference data, and generating reports.
              </p>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Content */}
      {!loading && !error && logs.length > 0 && (
        <>
          {/* Filters */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  type="search"
                  value={filters.search}
                  onChange={(e) => update('search', e.target.value)}
                  placeholder="Search by user, activity, or role..."
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 transition-colors focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:bg-slate-900 dark:focus:ring-blue-500/20"
                />
              </div>

              <select
                value={filters.module}
                onChange={(e) => update('module', e.target.value)}
                className={SELECT_CLASS}
              >
                <option value="">All Modules</option>
                {uniqueModules.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>

              <select
                value={filters.status}
                onChange={(e) => update('status', e.target.value)}
                className={SELECT_CLASS}
              >
                <option value="">All Status</option>
                <option value="Success">Success</option>
                <option value="Warning">Warning</option>
                <option value="Failed">Failed</option>
              </select>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => setFilters(EMPTY_FILTERS)}
                  className="h-10 rounded-lg px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <Card className="shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <CardHeader
              title="System Activity Log"
              subtitle={`Showing ${filteredLogs.length} of ${logs.length} events`}
              action={
                <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <Filter className="h-3.5 w-3.5" />
                  Read-only
                </span>
              }
            />
            <CardBody className="px-0 py-0">
              {filteredLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ScrollText className="h-6 w-6 text-slate-400 dark:text-slate-500" />
                  <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                    No activity found matching your filters.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                        <th className="px-5 py-3 font-semibold">Date / Time</th>
                        <th className="px-5 py-3 font-semibold">User</th>
                        <th className="px-5 py-3 font-semibold">Role</th>
                        <th className="px-5 py-3 font-semibold">Activity</th>
                        <th className="px-5 py-3 font-semibold">Module</th>
                        <th className="px-5 py-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredLogs.map((log) => {
                        const Icon = MODULE_ICON[log.module] ?? CheckCircle2;
                        return (
                          <tr
                            key={log.id}
                            className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/50"
                          >
                            <td className="whitespace-nowrap px-5 py-3">
                              <div className="flex flex-col">
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                  {formatTimestamp(log.timestamp)}
                                </span>
                                {relativeTime(log.timestamp) && (
                                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                    {relativeTime(log.timestamp)}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-5 py-3 font-medium text-slate-800 dark:text-slate-200">
                              {log.user}
                            </td>
                            <td className="whitespace-nowrap px-5 py-3 text-xs text-slate-500 dark:text-slate-400">
                              {log.role}
                            </td>
                            <td className="px-5 py-3 text-slate-700 dark:text-slate-300">
                              {log.activity}
                            </td>
                            <td className="whitespace-nowrap px-5 py-3">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${
                                  MODULE_TONE[log.module] ??
                                  'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                }`}
                              >
                                <Icon className="h-3 w-3" />
                                {log.module}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-5 py-3">
                              <Badge tone={STATUS_TONE[log.status]} dot>
                                {log.status}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}

function StatTile({
  label,
  value,
  tone = 'text-slate-900 dark:text-slate-100',
}: {
  label: string;
  value: number;
  tone?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-semibold ${tone}`}>{value}</p>
    </div>
  );
}