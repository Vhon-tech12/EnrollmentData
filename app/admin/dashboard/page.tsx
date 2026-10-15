'use client';

import { useMemo } from 'react';
import {
  LayoutDashboard,
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  ArrowRight,
  FileText,
  BarChart3,
  Inbox,
  Lock,
  AlertCircle,
  Building2,
} from 'lucide-react';
import Link from 'next/link';
import { useEnrollments } from '@/lib/useEnrollments';
import { useAnalytics } from '@/lib/useAnalytics';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Badge, { type BadgeTone } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

type EnrollmentStatus = 'Enrolled' | 'Pending' | 'Cancelled';

const STATUS_TONE: Record<EnrollmentStatus, BadgeTone> = {
  Enrolled: 'success',
  Pending: 'warning',
  Cancelled: 'danger',
};

const PROGRAM_COLORS: Record<string, string> = {
  BSIT: 'bg-blue-600',
  BSCS: 'bg-sky-500',
  BSBA: 'bg-indigo-500',
  BSA: 'bg-violet-500',
  BSED: 'bg-teal-500',
};

const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

export default function AdminDashboardPage() {
  const { records, loading, error } = useEnrollments();
  const analytics = useAnalytics(records);

  const byProgram = useMemo(() => {
    return analytics.byProgram;
  }, [analytics.byProgram]);

  const yearLevelData = useMemo(() => {
    return YEAR_LEVELS.map((y) => ({
      label: y,
      value: records.filter((r) => r.yearLevel === y).length,
    }));
  }, [records]);

  const topProgram = byProgram.reduce(
    (max, p) => (p.value > max.value ? p : max),
    { label: '—', value: 0, color: 'bg-slate-400' },
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <Header />
        <Card className="shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <CardBody>
            <div className="flex items-center justify-center gap-3 py-16">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600 dark:border-blue-900 dark:border-t-blue-500" />
              <p className="text-sm text-slate-500 dark:text-slate-400">Loading dashboard…</p>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Header />
        <Card className="shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <CardBody>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-8 w-8 text-red-500 dark:text-red-400" />
              <p className="mt-3 text-sm font-medium text-slate-800 dark:text-slate-200">
                Failed to load dashboard
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{error}</p>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="space-y-6">
        <Header />
        <Card className="shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <CardBody>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <Inbox className="h-7 w-7 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
                Wala pang enrollment data
              </h3>
              <p className="mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400">
                Ang enrollment data ay ina-upload ng Registrar. Kapag may data na,
                automatic itong lalabas dito.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header />

      {/* Read-only notice - Fixed for Dark Mode */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-500/30 dark:bg-blue-500/10">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
            <Lock className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-semibold text-blue-900 dark:text-blue-200">
              Read-only management view
            </p>
            <p className="mt-0.5 text-xs text-blue-700 dark:text-blue-300/80">
              Ang lahat ng data dito ay galing sa Registrar. Bilang School
              Administrator, pwede mong tingnan at i-export pero hindi baguhin.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total Enrollment"
          value={analytics.total.toLocaleString()}
          hint="All enrollment records"
          icon={<Users className="h-5 w-5" />}
          accent="bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
        />
        <KpiCard
          label="Enrolled"
          value={analytics.enrolled.toLocaleString()}
          hint={`${analytics.enrollmentRate.toFixed(1)}% enrollment rate`}
          icon={<CheckCircle2 className="h-5 w-5" />}
          accent="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
        />
        <KpiCard
          label="Pending"
          value={analytics.pending.toLocaleString()}
          hint="Awaiting verification"
          icon={<Clock className="h-5 w-5" />}
          accent="bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
        />
        <KpiCard
          label="Top Program"
          value={topProgram.label}
          hint={`${topProgram.value} students`}
          icon={<Building2 className="h-5 w-5" />}
          accent="bg-violet-50 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400"
        />
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="shadow-lg xl:col-span-2 dark:border-slate-800 dark:bg-slate-900">
          <CardHeader
            title="Enrollment by Program"
            subtitle="Distribution across degree programs"
          />
          <CardBody>
            <HorizontalBarChart data={byProgram} />
          </CardBody>
        </Card>

        <Card className="shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <CardHeader
            title="Enrollment by Year Level"
            subtitle="Students per year level"
          />
          <CardBody>
            <VerticalBarChart data={yearLevelData} />
          </CardBody>
        </Card>
      </section>

      {/* Status + Share */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <CardHeader
            title="Enrollment Status"
            subtitle="Breakdown by status"
          />
          <CardBody>
            <StatusBreakdown
              enrolled={analytics.enrolled}
              pending={analytics.pending}
              cancelled={analytics.cancelled}
              total={analytics.total}
            />
          </CardBody>
        </Card>

        <Card className="shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <CardHeader
            title="Program Share"
            subtitle="Percentage share per program"
          />
          <CardBody className="px-0 py-0">
            <ProgramShareTable
              data={byProgram}
              total={analytics.total}
            />
          </CardBody>
        </Card>
      </section>

      {/* Quick Actions */}
      <Card className="shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <CardHeader
          title="Quick Actions"
          subtitle="Common tasks for the School Administrator"
        />
        <CardBody>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <QuickAction
              icon={<Users className="h-5 w-5" />}
              label="View Enrollment"
              description="Browse all records"
              href="/admin/enrollment"
              tone="bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
            />
            <QuickAction
              icon={<BarChart3 className="h-5 w-5" />}
              label="Analytics"
              description="Deep dive into data"
              href="/admin/analytics"
              tone="bg-violet-50 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400"
            />
            <QuickAction
              icon={<FileText className="h-5 w-5" />}
              label="Generate Reports"
              description="Export enrollment reports"
              href="/admin/reports"
              tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
            />
            <QuickAction
              icon={<TrendingUp className="h-5 w-5" />}
              label="View Trends"
              description="Year-over-year data"
              href="/admin/analytics"
              tone="bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
            />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

// ============ HEADER ============
function Header() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:border dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400">
          <LayoutDashboard className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Administrator Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            School-wide enrollment monitoring and analytics.
          </p>
        </div>
      </div>

      <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 dark:border-blue-500/30 dark:bg-blue-500/10">
        <Lock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
        <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
          Read-only
        </span>
      </span>
    </div>
  );
}

// ============ KPI CARD ============
function KpiCard({
  label,
  value,
  hint,
  icon,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md transition-shadow hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
        </div>
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent}`}
        >
          {icon}
        </span>
      </div>
    </div>
  );
}

// ============ HORIZONTAL BAR ============
function HorizontalBarChart({
  data,
}: {
  data: { label: string; value: number; color: string }[];
}) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <BarChart3 className="h-6 w-6 text-slate-400 dark:text-slate-500" />
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">No data.</p>
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="space-y-4 py-2">
      {data.map((d) => (
        <div key={d.label}>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {d.label}
            </span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {d.value}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className={`h-full rounded-full ${d.color}`}
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============ VERTICAL BAR ============
function VerticalBarChart({
  data,
}: {
  data: { label: string; value: number }[];
}) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex h-56 items-end justify-around gap-2 px-2 pb-2">
      {data.map((d) => (
        <div
          key={d.label}
          className="flex h-full flex-1 flex-col items-center justify-end"
        >
          <span className="mb-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            {d.value}
          </span>
          <div
            className="w-full max-w-[44px] rounded-t-md bg-blue-600 transition-all hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
            style={{ height: `${(d.value / max) * 75}%` }}
          />
          <span className="mt-2 text-[10px] text-slate-500 dark:text-slate-400">
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ============ STATUS BREAKDOWN ============
function StatusBreakdown({
  enrolled,
  pending,
  cancelled,
  total,
}: {
  enrolled: number;
  pending: number;
  cancelled: number;
  total: number;
}) {
  const rows = [
    {
      label: 'Enrolled',
      value: enrolled,
      tone: 'bg-emerald-500',
      color: 'text-emerald-700 dark:text-emerald-400',
    },
    {
      label: 'Pending',
      value: pending,
      tone: 'bg-amber-500',
      color: 'text-amber-700 dark:text-amber-400',
    },
    {
      label: 'Cancelled',
      value: cancelled,
      tone: 'bg-red-500',
      color: 'text-red-700 dark:text-red-400',
    },
  ];

  return (
    <div className="space-y-4 py-2">
      {rows.map((r) => {
        const pct = total > 0 ? (r.value / total) * 100 : 0;
        return (
          <div key={r.label}>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {r.label}
              </span>
              <span className={`font-semibold ${r.color}`}>
                {r.value} ({pct.toFixed(1)}%)
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className={`h-full rounded-full ${r.tone}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============ PROGRAM SHARE TABLE ============
function ProgramShareTable({
  data,
  total,
}: {
  data: { label: string; value: number; color: string }[];
  total: number;
}) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-xs text-slate-500 dark:text-slate-400">No data.</p>
      </div>
    );
  }

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <th className="px-5 py-3 font-semibold">Program</th>
          <th className="px-5 py-3 font-semibold">Students</th>
          <th className="px-5 py-3 text-right font-semibold">Share</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
        {data.map((p) => {
          const share = total > 0 ? (p.value / total) * 100 : 0;
          return (
            <tr
              key={p.label}
              className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/50"
            >
              <td className="whitespace-nowrap px-5 py-3">
                <div className="flex items-center gap-2.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${p.color}`} />
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {p.label}
                  </span>
                </div>
              </td>
              <td className="whitespace-nowrap px-5 py-3 text-slate-700 dark:text-slate-300">
                {p.value}
              </td>
              <td className="whitespace-nowrap px-5 py-3 text-right">
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {share.toFixed(1)}%
                </span>
              </td>
            </tr>
          );
        })}
        <tr className="border-t border-slate-200 bg-slate-50 font-semibold dark:border-slate-800 dark:bg-slate-800/50">
          <td className="px-5 py-3 text-slate-700 dark:text-slate-300">Total</td>
          <td className="px-5 py-3 text-slate-900 dark:text-slate-100">{total}</td>
          <td className="px-5 py-3 text-right text-slate-900 dark:text-slate-100">
            100%
          </td>
        </tr>
      </tbody>
    </table>
  );
}

// ============ QUICK ACTION ============
function QuickAction({
  icon,
  label,
  description,
  href,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  href: string;
  tone: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-blue-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500/50 dark:hover:bg-slate-800/50"
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone} transition-transform group-hover:scale-110`}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          {label}
        </p>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-blue-500 dark:text-slate-600 dark:group-hover:text-blue-400" />
    </Link>
  );
}