'use client';

import { useMemo } from 'react';
import {
  Building2,
  Users,
  GraduationCap,
  Clock,
  ArrowRight,
  Inbox,
  BarChart3,
  TrendingUp,
  AlertCircle,
  Lock,
} from 'lucide-react';
import Link from 'next/link';
import { useEnrollments } from '@/lib/useEnrollments';
import { useAnalytics } from '@/lib/useAnalytics';
import { useCurrentDepartment } from '@/lib/useCurrentDepartment';
import {
  KpiCard,
  HorizontalBarChart,
  VerticalBarChart,
  DonutChart,
  EmptyChart,
  LoadingChart,
} from '@/components/analytics/Charts';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';

const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

export default function DepartmentHeadDashboard() {
  const { records, loading: recordsLoading, error } = useEnrollments();
  const { department, loading: deptLoading } = useCurrentDepartment();

  const deptRecords = useMemo(() => {
    if (!department) return [];
    return records.filter((r) => department.programs.includes(r.program));
  }, [records, department]);

  const analytics = useAnalytics(deptRecords);

  const yearLevelData = useMemo(() => {
    return YEAR_LEVELS.map((y) => ({
      label: y,
      value: deptRecords.filter((r) => r.yearLevel === y).length,
    }));
  }, [deptRecords]);

  if (recordsLoading || deptLoading || !department) {
    return (
      <div className="space-y-6">
        <Card className="shadow-lg">
          <CardBody>
            <LoadingChart />
          </CardBody>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Header department={department} />
        <Card className="shadow-lg">
          <CardBody>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <p className="mt-3 text-sm font-medium text-slate-800 dark:text-slate-200">
                Failed to load dashboard
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

  // Kung walang programs sa department
  if (department.programs.length === 0) {
    return (
      <div className="space-y-6">
        <Header department={department} />
        <Card className="shadow-lg">
          <CardBody>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <Building2 className="h-7 w-7 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
                No programs assigned
              </h3>
              <p className="mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400">
                Your department has no programs assigned in the system yet.
                Contact the School Administrator.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Kung walang enrollment data
  if (deptRecords.length === 0) {
    return (
      <div className="space-y-6">
        <Header department={department} />
        <Card className="shadow-lg">
          <CardBody>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <Inbox className="h-7 w-7 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
                No enrollment data for your department yet
              </h3>
              <p className="mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400">
                There are no enrollment records for programs under{' '}
                <span className="font-medium">{department.name}</span>. Ask the
                Registrar to import enrollment data first.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header department={department} />

      {/* Info banner */}
      <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
            <Building2 className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-300">
              Department-scoped access
            </p>
            <p className="mt-0.5 text-xs text-emerald-700 dark:text-emerald-400">
              You are viewing data for{' '}
              <span className="font-semibold">{department.name}</span> (
              {department.programs.join(', ')}).
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total Students"
          value={analytics.total.toLocaleString()}
          hint={`In ${department.shortName}`}
          icon={<Users className="h-5 w-5" />}
          accent="bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400"
        />
        <KpiCard
          label="Enrolled"
          value={analytics.enrolled.toLocaleString()}
          hint={`${analytics.enrollmentRate.toFixed(1)}% enrollment rate`}
          icon={<GraduationCap className="h-5 w-5" />}
          accent="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
        />
        <KpiCard
          label="Pending"
          value={analytics.pending.toLocaleString()}
          hint="Awaiting verification"
          icon={<Clock className="h-5 w-5" />}
          accent="bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400"
        />
        <KpiCard
          label="Programs"
          value={String(department.programs.length)}
          hint={department.programs.join(' · ')}
          icon={<Building2 className="h-5 w-5" />}
          accent="bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400"
        />
      </section>

      {/* Pending alert */}
      {analytics.pending > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">
            <AlertCircle className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">
              {analytics.pending} enrollment record
              {analytics.pending !== 1 ? 's' : ''} awaiting verification
            </p>
            <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
              These records are pending approval by the Registrar.
            </p>
          </div>
        </div>
      )}

      {/* Charts */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader
            title="Enrollment by Program"
            subtitle="Distribution across department programs"
          />
          <CardBody>
            {analytics.byProgram.length === 0 ? (
              <EmptyChart />
            ) : (
              <HorizontalBarChart data={analytics.byProgram} />
            )}
          </CardBody>
        </Card>

        <Card className="shadow-lg">
          <CardHeader
            title="Enrollment by Year Level"
            subtitle="Students per year level"
          />
          <CardBody>
            <VerticalBarChart data={yearLevelData} />
          </CardBody>
        </Card>
      </section>

      {/* Status + Programs */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader title="Enrollment Status" subtitle="Breakdown by status" />
          <CardBody>
            {analytics.byStatus.length === 0 ? (
              <EmptyChart />
            ) : (
              <DonutChart data={analytics.byStatus} total={analytics.total} />
            )}
          </CardBody>
        </Card>

        <Card className="shadow-lg">
          <CardHeader
            title="Programs Overview"
            subtitle="Enrolled vs total per program"
          />
          <CardBody className="px-0 py-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                    <th className="px-5 py-3 font-semibold">Program</th>
                    <th className="px-5 py-3 text-right font-semibold">Enrolled</th>
                    <th className="px-5 py-3 text-right font-semibold">Total</th>
                    <th className="px-5 py-3 text-right font-semibold">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {analytics.byProgram.map((p) => {
                    const share =
                      analytics.total > 0 ? (p.value / analytics.total) * 100 : 0;
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
                        <td className="whitespace-nowrap px-5 py-3 text-right text-emerald-700 dark:text-emerald-400">
                          {p.enrolled}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-right font-semibold text-slate-900 dark:text-slate-100">
                          {p.value}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-right text-slate-700 dark:text-slate-300">
                          {share.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="border-t border-slate-200 bg-slate-50 font-semibold dark:border-slate-800 dark:bg-slate-800/50">
                    <td className="px-5 py-3 text-slate-700 dark:text-slate-300">
                      Total
                    </td>
                    <td className="px-5 py-3 text-right text-emerald-700 dark:text-emerald-400">
                      {analytics.enrolled}
                    </td>
                    <td className="px-5 py-3 text-right text-slate-900 dark:text-slate-100">
                      {analytics.total}
                    </td>
                    <td className="px-5 py-3 text-right text-slate-900 dark:text-slate-100">
                      100%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      </section>

      {/* Quick Actions */}
      <Card className="shadow-lg">
        <CardHeader
          title="Quick Actions"
          subtitle="Common tasks for Department Heads"
        />
        <CardBody>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <QuickAction
              icon={<BarChart3 className="h-5 w-5" />}
              label="Department Analytics"
              description="Deep dive into trends"
              href="/department-head/analytics"
              tone="bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400"
            />
            <QuickAction
              icon={<TrendingUp className="h-5 w-5" />}
              label="Enrollment Trends"
              description="See year-over-year data"
              href="/department-head/analytics"
              tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
            />
            <QuickAction
              icon={<GraduationCap className="h-5 w-5" />}
              label="Department Reports"
              description="Generate program reports"
              href="/department-head/reports"
              tone="bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400"
            />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function Header({
  department,
}: {
  department: { name: string; shortName: string };
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
          <Building2 className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Department Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {department.name} · {department.shortName}
          </p>
        </div>
      </div>

      <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 dark:border-emerald-900 dark:bg-emerald-950/40">
        <Lock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
          {department.shortName} Access
        </span>
      </span>
    </div>
  );
}

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
      className="group flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-blue-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700 dark:hover:shadow-lg dark:hover:shadow-black/40"
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