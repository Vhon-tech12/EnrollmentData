'use client';

import { useMemo } from 'react';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  PlusCircle,
  FileText,
  TrendingUp,
  ArrowRight,
  Users,
  AlertCircle,
  Inbox,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';
import { useEnrollments } from '@/lib/useEnrollments';
import { useAnalytics, PROGRAM_COLORS } from '@/lib/useAnalytics';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Badge, { type BadgeTone } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

type EnrollmentStatus = 'Enrolled' | 'Pending' | 'Cancelled';

const STATUS_TONE: Record<EnrollmentStatus, BadgeTone> = {
  Enrolled: 'success',
  Pending: 'warning',
  Cancelled: 'danger',
};

const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

export default function RegistrarDashboardPage() {
  const { records, loading, error } = useEnrollments();
  const analytics = useAnalytics(records);

  // Recent submissions — sorted by dateEnrolled, take top 5
  const recentSubmissions = useMemo(() => {
    return [...records]
      .sort((a, b) => {
        const dateA = new Date(a.dateEnrolled).getTime() || 0;
        const dateB = new Date(b.dateEnrolled).getTime() || 0;
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [records]);

  // Year level counts
  const yearLevelData = useMemo(() => {
    return YEAR_LEVELS.map((y) => ({
      label: y,
      value: records.filter((r) => r.yearLevel === y).length,
    }));
  }, [records]);

  // Loading
  if (loading) {
    return (
      <div className="space-y-6">
        <Header />
        <Card className="shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <CardBody>
            <div className="flex items-center justify-center gap-3 py-16">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600 dark:border-blue-900 dark:border-t-blue-500" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Loading dashboard…
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="space-y-6">
        <Header />
        <Card className="shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <CardBody>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                Failed to load dashboard data
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {error}
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Empty
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
                Import enrollment data first to see your dashboard populate
                with real analytics.
              </p>
              <Link href="/registrar/enrollment" className="mt-5">
                <Button icon={<PlusCircle className="h-4 w-4" />}>
                  Go to Enrollment
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header />

      {/* KPI Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total Records"
          value={analytics.total.toLocaleString()}
          hint="Active enrollment records"
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
          label="Pending Verification"
          value={analytics.pending.toLocaleString()}
          hint="Awaiting approval"
          icon={<Clock className="h-5 w-5" />}
          accent="bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
        />
        <KpiCard
          label="Cancelled"
          value={analytics.cancelled.toLocaleString()}
          hint="Cancelled enrollments"
          icon={<AlertCircle className="h-5 w-5" />}
          accent="bg-red-50 text-red-600 dark:bg-red-500/20 dark:text-red-400"
        />
      </section>

      {/* ❌ REMOVED: Pending Alert Banner */}

      {/* Program + Year Level Charts */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="shadow-lg xl:col-span-2 dark:border-slate-800 dark:bg-slate-900">
          <CardHeader
            title="Enrollment by Program"
            subtitle="Distribution across degree programs"
          />
          <CardBody>
            {analytics.byProgram.length === 0 ? (
              <EmptyChart />
            ) : (
              <HorizontalBarChart data={analytics.byProgram} />
            )}
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

      {/* Recent Submissions */}
      <Card className="shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <CardHeader
          title="Recent Enrollment Submissions"
          subtitle="Latest records submitted to the system"
          action={
            <Link
              href="/registrar/enrollment"
              className="text-xs font-medium text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              View all →
            </Link>
          }
        />
        <CardBody className="px-0 py-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="px-5 py-3 font-semibold">Student ID</th>
                  <th className="px-5 py-3 font-semibold">Student Name</th>
                  <th className="px-5 py-3 font-semibold">Program</th>
                  <th className="px-5 py-3 font-semibold">Year Level</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Date Enrolled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentSubmissions.map((row) => (
                  <tr
                    key={row.id}
                    className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/50"
                  >
                    <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                      {row.studentId}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 font-medium text-slate-800 dark:text-slate-200">
                      {row.studentName}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3">
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {row.program}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-slate-700 dark:text-slate-300">
                      {row.yearLevel}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3">
                      <Badge tone={STATUS_TONE[row.status]} dot>
                        {row.status}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right text-xs text-slate-500 dark:text-slate-400">
                      {row.dateEnrolled}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Quick Actions */}
      <Card className="shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <CardHeader
          title="Quick Actions"
          subtitle="Common tasks for the Registrar"
        />
        <CardBody>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <QuickAction
              icon={<PlusCircle className="h-5 w-5" />}
              label="Add Enrollment"
              description="Create new student record"
              href="/registrar/enrollment"
              tone="bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
            />
            <QuickAction
              icon={<Clock className="h-5 w-5" />}
              label="Verify Pending"
              description="Review submissions"
              href="/registrar/enrollment"
              tone="bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
            />
            <QuickAction
              icon={<FileText className="h-5 w-5" />}
              label="Generate Report"
              description="Create enrollment report"
              href="/registrar/reports"
              tone="bg-violet-50 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400"
            />
            <QuickAction
              icon={<TrendingUp className="h-5 w-5" />}
              label="View Analytics"
              description="See enrollment trends"
              href="/registrar/analytics"
              tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
            />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

// ============ HEADER ============
// ❌ REMOVED: The "View Pending" and "Add Enrollment" buttons
function Header() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:border dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400">
          <ClipboardList className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Registrar Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Your daily enrollment operations overview.
          </p>
        </div>
      </div>
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
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {hint}
          </p>
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

// ============ EMPTY CHART ============
function EmptyChart() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <BarChart3 className="h-6 w-6 text-slate-400 dark:text-slate-500" />
      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        No data to display.
      </p>
    </div>
  );
}