'use client';

import { useState, useMemo } from 'react';
import {
  BarChart3,
  Users,
  Percent,
  TrendingUp,
  Building2,
  Inbox,
  AlertCircle,
  Activity,
  Layers,
  MapPin,
  Calendar,
  PieChart,
} from 'lucide-react';
import { useEnrollments } from '@/lib/useEnrollments';
import { useAnalytics } from '@/lib/useAnalytics';
import {
  KpiCard,
  HorizontalBarChart,
  VerticalBarChart,
  SectionChart,
  DonutChart,
  EmptyChart,
  LoadingChart,
} from '@/components/analytics/Charts';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';

const ACADEMIC_YEARS = ['2025-2026', '2024-2025', '2023-2024', '2022-2023', '2021-2022'];
const PROGRAMS = ['BSIT', 'BSCS', 'BSBA', 'BSA', 'BSED'];
const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const SECTIONS = ['A', 'B', 'C', 'D', 'E'];

const SELECT_CLASS =
  'h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 transition-colors hover:bg-slate-50 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200';

interface FilterState {
  academicYear: string;
  program: string;
  yearLevel: string;
  section: string;
}

const EMPTY_FILTERS: FilterState = {
  academicYear: '',
  program: '',
  yearLevel: '',
  section: '',
};

export default function AdminAnalyticsPage() {
  const { records, loading, error } = useEnrollments();
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);

  // Filtered records — for matrices
  const filtered = useMemo(() => {
    return records.filter((r) => {
      return (
        (!filters.academicYear || r.academicYear === filters.academicYear) &&
        (!filters.program || r.program === filters.program) &&
        (!filters.yearLevel || r.yearLevel === filters.yearLevel) &&
        (!filters.section || r.section === filters.section)
      );
    });
  }, [records, filters]);

  const analytics = useAnalytics(records, {
    academicYear: filters.academicYear,
    program: filters.program,
    yearLevel: filters.yearLevel,
    section: filters.section,
  });

  // Trend data — chronological order (keeps all 5 years)
  const trendData = useMemo(() => {
    return [...ACADEMIC_YEARS].reverse().map((ay) => {
      const rows = records.filter((r) => {
        if (filters.program && r.program !== filters.program) return false;
        if (filters.yearLevel && r.yearLevel !== filters.yearLevel) return false;
        if (filters.section && r.section !== filters.section) return false;
        return r.academicYear === ay;
      });
      return {
        year: ay,
        enrolled: rows.filter((r) => r.status === 'Enrolled').length,
        pending: rows.filter((r) => r.status === 'Pending').length,
        cancelled: rows.filter((r) => r.status === 'Cancelled').length,
        total: rows.length,
      };
    });
  }, [records, filters]);

  const yearLevelTrend = useMemo(() => {
    return YEAR_LEVELS.map((y) => ({
      year: y,
      enrolled: records.filter(
        (r) => r.yearLevel === y && r.status === 'Enrolled',
      ).length,
      pending: records.filter(
        (r) => r.yearLevel === y && r.status === 'Pending',
      ).length,
      total: records.filter((r) => r.yearLevel === y).length,
    }));
  }, [records]);

  // ============ MATRICES ============
  // Program × Year Level matrix
  const programYearMatrix = PROGRAMS.map((p) => {
    const row = {
      program: p,
      total: 0,
      byYear: {} as Record<string, number>,
    };
    YEAR_LEVELS.forEach((y) => {
      const count = filtered.filter(
        (r) => r.program === p && r.yearLevel === y,
      ).length;
      row.byYear[y] = count;
      row.total += count;
    });
    return row;
  }).filter((row) => row.total > 0);

  // Academic Year × Program matrix
  const academicYearMatrix = ACADEMIC_YEARS.map((ay) => {
    const row = {
      year: ay,
      total: 0,
      byProgram: {} as Record<string, number>,
    };
    PROGRAMS.forEach((p) => {
      const count = records.filter(
        (r) => r.academicYear === ay && r.program === p,
      ).length;
      row.byProgram[p] = count;
      row.total += count;
    });
    return row;
  }).filter((row) => row.total > 0);

  // Year Level × Section matrix
  const yearSectionMatrix = YEAR_LEVELS.map((y) => {
    const row = {
      year: y,
      total: 0,
      bySection: {} as Record<string, number>,
    };
    SECTIONS.forEach((s) => {
      const count = filtered.filter(
        (r) => r.yearLevel === y && r.section === s,
      ).length;
      row.bySection[`Section ${s}`] = count;
      row.total += count;
    });
    return row;
  }).filter((row) => row.total > 0);

  // Status by Program
  const statusByProgram = PROGRAMS.map((p) => {
    const rows = filtered.filter((r) => r.program === p);
    return {
      program: p,
      enrolled: rows.filter((r) => r.status === 'Enrolled').length,
      pending: rows.filter((r) => r.status === 'Pending').length,
      cancelled: rows.filter((r) => r.status === 'Cancelled').length,
      total: rows.length,
    };
  }).filter((d) => d.total > 0);

  const update = (key: keyof FilterState, value: string) =>
    setFilters({ ...filters, [key]: value });

  const hasActiveFilters = Boolean(
    filters.academicYear || filters.program || filters.yearLevel || filters.section,
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <Header />
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
        <Header />
        <Card className="shadow-lg">
          <CardBody>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <p className="mt-3 text-sm font-medium text-slate-800 dark:text-slate-200">
                Failed to load analytics
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
        <Card className="shadow-lg">
          <CardBody>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <Inbox className="h-7 w-7 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
                No enrollment data to analyze yet
              </h3>
              <p className="mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400">
                Enrollment data is uploaded by the Registrar. Analytics will automatically populate once data is available.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header recordCount={records.length} />

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Filters:
          </span>

          <select
            value={filters.academicYear}
            onChange={(e) => update('academicYear', e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">All Academic Years</option>
            {ACADEMIC_YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <select
            value={filters.program}
            onChange={(e) => update('program', e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">All Programs</option>
            {PROGRAMS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <select
            value={filters.yearLevel}
            onChange={(e) => update('yearLevel', e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">All Year Levels</option>
            {YEAR_LEVELS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <select
            value={filters.section}
            onChange={(e) => update('section', e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">All Sections</option>
            {SECTIONS.map((s) => (
              <option key={s} value={s}>Section {s}</option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="h-10 rounded-lg px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              Clear Filters
            </button>
          )}
        </div>
        {hasActiveFilters && (
          <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">
            Showing{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {analytics.total}
            </span>{' '}
            of {records.length} records matching your filters.
          </p>
        )}
      </div>

      {/* KPI Cards — Emerald/Amber theme */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total Records"
          value={analytics.total.toLocaleString()}
          hint="Matching filters"
          icon={<Users className="h-5 w-5" />}
          accent="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
        />
        <KpiCard
          label="Enrollment Rate"
          value={`${analytics.enrollmentRate.toFixed(1)}%`}
          hint={`${analytics.enrolled} enrolled`}
          icon={<Percent className="h-5 w-5" />}
          accent="bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400"
        />
        <KpiCard
          label="Pending"
          value={analytics.pending.toLocaleString()}
          hint="Awaiting verification"
          icon={<TrendingUp className="h-5 w-5" />}
          accent="bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400"
        />
        <KpiCard
          label="Top Program"
          value={analytics.topProgram?.label ?? '—'}
          hint={
            analytics.topProgram
              ? `${analytics.topProgram.value} records`
              : 'No data'
          }
          icon={<Building2 className="h-5 w-5" />}
          accent="bg-orange-50 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400"
        />
      </div>

      {/* PRIMARY GRADIENT LINE CHART — Emerald + Amber */}
      <Card className="shadow-lg">
        <CardHeader
          title="Enrollment Trend by Academic Year"
          subtitle="Total records vs confirmed enrollments (last 5 academic years)"
          action={
            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
              <Activity className="h-3.5 w-3.5" />
              Trend
            </span>
          }
        />
        <CardBody>
          <GradientLineChart data={trendData} variant="dual" />
        </CardBody>
      </Card>

      {/* SECONDARY GRADIENT LINE CHART — Year Level */}
      <Card className="shadow-lg">
        <CardHeader
          title="Enrollment Distribution by Year Level"
          subtitle="How enrollment flows across year levels (1st → 4th)"
          action={
            <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
              <Activity className="h-3.5 w-3.5" />
              Distribution
            </span>
          }
        />
        <CardBody>
          <GradientLineChart data={yearLevelTrend} variant="single" />
        </CardBody>
      </Card>

      {/* Program + Year Level bars */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="shadow-lg">
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

        <Card className="shadow-lg">
          <CardHeader
            title="Enrollment by Year Level"
            subtitle="Students per year level"
          />
          <CardBody>
            <VerticalBarChart data={analytics.byYearLevel} />
          </CardBody>
        </Card>
      </div>

      {/* Section + Status */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader
            title="Enrollment by Section"
            subtitle="Section-level distribution"
          />
          <CardBody>
            {analytics.bySection.length === 0 ? (
              <EmptyChart />
            ) : (
              <SectionChart data={analytics.bySection} />
            )}
          </CardBody>
        </Card>

        <Card className="shadow-lg">
          <CardHeader
            title="Enrollment Status Distribution"
            subtitle="Breakdown by status"
          />
          <CardBody>
            {analytics.byStatus.length === 0 ? (
              <EmptyChart />
            ) : (
              <DonutChart data={analytics.byStatus} total={analytics.total} />
            )}
          </CardBody>
        </Card>
      </div>

      {/* ============ Program × Year Level Matrix (Heatmap) ============ */}
      {programYearMatrix.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader
            title="Program × Year Level Matrix"
            subtitle="Color intensity shows enrollment density per program-year combination"
            action={
              <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                <Activity className="h-3.5 w-3.5" />
                Heatmap
              </span>
            }
          />
          <CardBody className="px-0 py-0">
            <GradientHeatmap
              rows={programYearMatrix.map((r) => ({
                label: r.program,
                values: r.byYear,
                total: r.total,
              }))}
              columns={YEAR_LEVELS}
              rowHeader="Program"
            />
          </CardBody>
        </Card>
      )}

      {/* ============ Academic Year × Program Matrix (Heatmap) ============ */}
      {academicYearMatrix.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader
            title="Academic Year × Program Matrix"
            subtitle="Color intensity shows enrollment density per academic year-program combination"
            action={
              <span className="inline-flex items-center gap-1.5 rounded-md bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 dark:bg-violet-950/60 dark:text-violet-400">
                <Calendar className="h-3.5 w-3.5" />
                Heatmap
              </span>
            }
          />
          <CardBody className="px-0 py-0">
            <GradientHeatmap
              rows={academicYearMatrix.map((r) => ({
                label: r.year,
                values: r.byProgram,
                total: r.total,
              }))}
              columns={PROGRAMS}
              rowHeader="Academic Year"
            />
          </CardBody>
        </Card>
      )}

      {/* ============ Year Level × Section Matrix (Heatmap) ============ */}
      {yearSectionMatrix.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader
            title="Year Level × Section Matrix"
            subtitle="Color intensity shows section density per year level"
            action={
              <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                <MapPin className="h-3.5 w-3.5" />
                Heatmap
              </span>
            }
          />
          <CardBody className="px-0 py-0">
            <GradientHeatmap
              rows={yearSectionMatrix.map((r) => ({
                label: r.year,
                values: r.bySection,
                total: r.total,
              }))}
              columns={SECTIONS.map((s) => `Section ${s}`)}
              rowHeader="Year Level"
            />
          </CardBody>
        </Card>
      )}

      {/* ============ Status Breakdown by Program (Gradient Stacked Bar) ============ */}
      {statusByProgram.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader
            title="Status Breakdown by Program"
            subtitle="Composition of Enrolled, Pending, and Cancelled per program"
            action={
              <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                <BarChart3 className="h-3.5 w-3.5" />
                Stacked
              </span>
            }
          />
          <CardBody className="px-0 py-0">
            <GradientStackedBar
              rows={statusByProgram.map((r) => ({
                label: r.program,
                total: r.total,
                segments: [
                  {
                    label: 'Enrolled',
                    value: r.enrolled,
                    gradient: 'bg-gradient-to-r from-emerald-400 to-emerald-600',
                  },
                  {
                    label: 'Pending',
                    value: r.pending,
                    gradient: 'bg-gradient-to-r from-amber-400 to-amber-500',
                  },
                  {
                    label: 'Cancelled',
                    value: r.cancelled,
                    gradient: 'bg-gradient-to-r from-red-400 to-red-600',
                  },
                ],
              }))}
            />
          </CardBody>
        </Card>
      )}
    </div>
  );
}

// ============ HEADER ============
function Header({ recordCount }: { recordCount?: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
        <BarChart3 className="h-5 w-5" />
      </span>
      <div>
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Enrollment Analytics
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {recordCount !== undefined
            ? `School-wide analytics from ${recordCount} record${recordCount !== 1 ? 's' : ''}.`
            : 'Analyze enrollment data across the institution.'}
        </p>
      </div>
    </div>
  );
}

// ============ GRADIENT LINE CHART — Emerald + Amber Theme ============
function GradientLineChart({
  data,
  variant = 'dual',
}: {
  data: { year: string; enrolled: number; total: number; pending?: number }[];
  variant?: 'dual' | 'single';
}) {
  if (data.length === 0) return null;

  const W = 900;
  const H = 340;
  const P = { t: 40, r: 30, b: 55, l: 60 };
  const cw = W - P.l - P.r;
  const ch = H - P.t - P.b;

  const maxVal = Math.max(...data.map((d) => d.total), 1);
  const yMax = Math.max(Math.ceil((maxVal * 1.15) / 5) * 5, 5);
  const xStep = data.length > 1 ? cw / (data.length - 1) : 0;

  const x = (i: number) => P.l + i * xStep + (data.length === 1 ? cw / 2 : 0);
  const y = (v: number) => P.t + ch - (v / yMax) * ch;

  const totalPts = data.map((d, i) => `${x(i)},${y(d.total)}`).join(' ');
  const enrolledPts = data.map((d, i) => `${x(i)},${y(d.enrolled)}`).join(' ');
  const pendingPts = data.map((d, i) => `${x(i)},${y(d.pending ?? 0)}`).join(' ');

  const totalArea =
    `M ${x(0)},${y(0)} ` +
    data.map((d, i) => `L ${x(i)},${y(d.total)}`).join(' ') +
    ` L ${x(data.length - 1)},${y(0)} Z`;

  const enrolledArea =
    `M ${x(0)},${y(0)} ` +
    data.map((d, i) => `L ${x(i)},${y(d.enrolled)}`).join(' ') +
    ` L ${x(data.length - 1)},${y(0)} Z`;

  const gridLines = [0, yMax / 4, yMax / 2, (yMax * 3) / 4, yMax].map((v) =>
    Math.round(v),
  );

  const gradId = variant === 'dual' ? 'admin' : 'admin-single';

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-80 w-full">
        <defs>
          <linearGradient id={`${gradId}-totalArea`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
            <stop offset="50%" stopColor="#10b981" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>

          <linearGradient id={`${gradId}-enrolledArea`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </linearGradient>

          <linearGradient id={`${gradId}-totalLine`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#047857" />
            <stop offset="50%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#6ee7b7" />
          </linearGradient>

          <linearGradient id={`${gradId}-enrolledLine`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#b45309" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
        </defs>

        {gridLines.map((v) => (
          <g key={v}>
            <line
              x1={P.l}
              x2={W - P.r}
              y1={y(v)}
              y2={y(v)}
              stroke="currentColor"
              className="text-slate-200 dark:text-slate-700"
              strokeDasharray="4 4"
            />
            <text
              x={P.l - 10}
              y={y(v) + 4}
              textAnchor="end"
              fontSize="11"
              fill="currentColor"
              className="text-slate-400 dark:text-slate-500"
            >
              {v}
            </text>
          </g>
        ))}

        <path d={totalArea} fill={`url(#${gradId}-totalArea)`} />
        {variant === 'dual' && (
          <path d={enrolledArea} fill={`url(#${gradId}-enrolledArea)`} />
        )}

        <polyline
          points={totalPts}
          fill="none"
          stroke={`url(#${gradId}-totalLine)`}
          strokeWidth="3.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {variant === 'dual' && (
          <polyline
            points={enrolledPts}
            fill="none"
            stroke={`url(#${gradId}-enrolledLine)`}
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {variant === 'single' && data.some((d) => (d.pending ?? 0) > 0) && (
          <polyline
            points={pendingPts}
            fill="none"
            stroke="#f43f5e"
            strokeWidth="2"
            strokeDasharray="6 4"
            strokeLinecap="round"
          />
        )}

        {data.map((d, i) => (
          <g key={`d-${i}`}>
            <circle
              cx={x(i)}
              cy={y(d.total)}
              r="7"
              fill="white"
              stroke="#10b981"
              strokeWidth="3"
              className="dark:fill-slate-900"
            />
            {d.total > 0 && (
              <text
                x={x(i)}
                y={y(d.total) - 16}
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill="currentColor"
                className="text-emerald-800 dark:text-emerald-300"
              >
                {d.total}
              </text>
            )}
          </g>
        ))}

        {variant === 'dual' &&
          data.map((d, i) => (
            <circle
              key={`e-${i}`}
              cx={x(i)}
              cy={y(d.enrolled)}
              r="5"
              fill="white"
              stroke="#f59e0b"
              strokeWidth="2.5"
              className="dark:fill-slate-900"
            />
          ))}

        {data.map((d, i) => (
          <text
            key={d.year}
            x={x(i)}
            y={H - 20}
            textAnchor="middle"
            fontSize="11"
            fill="currentColor"
            className="text-slate-500 dark:text-slate-400"
            fontWeight="500"
          >
            {d.year}
          </text>
        ))}
      </svg>

      <div className="mt-4 flex flex-wrap justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <span
            className="h-3 w-3 rounded-full"
            style={{ background: 'linear-gradient(90deg, #047857, #6ee7b7)' }}
          />
          <span className="font-medium text-slate-700 dark:text-slate-300">
            Total Records
          </span>
        </div>
        {variant === 'dual' && (
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ background: 'linear-gradient(90deg, #b45309, #fbbf24)' }}
            />
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Enrolled
            </span>
          </div>
        )}
        {variant === 'single' && (
          <div className="flex items-center gap-2">
            <span className="h-0.5 w-3 rounded-full bg-rose-500" />
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Pending
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ============ GRADIENT HEATMAP ============
function GradientHeatmap({
  rows,
  columns,
  rowHeader,
}: {
  rows: { label: string; values: Record<string, number>; total: number }[];
  columns: string[];
  rowHeader: string;
}) {
  const maxCell = Math.max(
    ...rows.flatMap((r) => columns.map((c) => r.values[c] || 0)),
    1,
  );

  const getCellStyle = (value: number) => {
    if (value === 0) {
      return {
        bg: 'bg-slate-50 dark:bg-slate-800/50',
        text: 'text-slate-300 dark:text-slate-600',
        fontWeight: 'font-normal',
      };
    }
    const intensity = value / maxCell;
    if (intensity >= 0.8)
      return { bg: 'bg-blue-700', text: 'text-white', fontWeight: 'font-bold' };
    if (intensity >= 0.6)
      return { bg: 'bg-blue-600', text: 'text-white', fontWeight: 'font-semibold' };
    if (intensity >= 0.4)
      return { bg: 'bg-blue-500', text: 'text-white', fontWeight: 'font-semibold' };
    if (intensity >= 0.25)
      return { bg: 'bg-blue-300', text: 'text-blue-900', fontWeight: 'font-semibold' };
    if (intensity >= 0.1)
      return { bg: 'bg-blue-200', text: 'text-blue-900', fontWeight: 'font-medium' };
    return { bg: 'bg-blue-100', text: 'text-blue-800', fontWeight: 'font-medium' };
  };

  const maxRowTotal = Math.max(...rows.map((r) => r.total), 1);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <th className="px-5 py-3 font-semibold">{rowHeader}</th>
            {columns.map((c) => (
              <th key={c} className="px-3 py-3 text-center font-semibold">
                {c}
              </th>
            ))}
            <th className="px-5 py-3 text-right font-semibold">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map((row) => (
            <tr
              key={row.label}
              className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
            >
              <td className="whitespace-nowrap px-5 py-3 font-medium text-slate-800 dark:text-slate-200">
                {row.label}
              </td>
              {columns.map((c) => {
                const value = row.values[c] || 0;
                const style = getCellStyle(value);
                return (
                  <td key={c} className="px-2 py-2 text-center">
                    <div
                      className={`mx-auto flex h-10 w-full max-w-[72px] items-center justify-center rounded-lg text-sm transition-all ${style.bg} ${style.text} ${style.fontWeight}`}
                      title={`${row.label} · ${c}: ${value}`}
                    >
                      {value > 0 ? value : '—'}
                    </div>
                  </td>
                );
              })}
              <td className="whitespace-nowrap px-5 py-3 text-right">
                <span className="inline-flex h-8 min-w-[48px] items-center justify-center rounded-lg bg-slate-100 px-3 font-bold text-slate-900 dark:bg-slate-800 dark:text-slate-100">
                  {row.total}
                </span>
              </td>
            </tr>
          ))}

          <tr className="border-t-2 border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
            <td className="whitespace-nowrap px-5 py-3 font-semibold text-slate-700 dark:text-slate-300">
              Total
            </td>
            {columns.map((c) => {
              const colTotal = rows.reduce((s, r) => s + (r.values[c] || 0), 0);
              const intensity = colTotal / maxRowTotal;
              const bgClass =
                colTotal === 0
                  ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600'
                  : intensity >= 0.6
                    ? 'bg-blue-600 text-white'
                    : intensity >= 0.3
                      ? 'bg-blue-400 text-white'
                      : 'bg-blue-200 text-blue-900';
              return (
                <td key={c} className="px-2 py-2 text-center">
                  <div
                    className={`mx-auto flex h-10 w-full max-w-[72px] items-center justify-center rounded-lg font-bold ${bgClass}`}
                  >
                    {colTotal > 0 ? colTotal : '—'}
                  </div>
                </td>
              );
            })}
            <td className="whitespace-nowrap px-5 py-3 text-right">
              <span className="inline-flex h-8 min-w-[48px] items-center justify-center rounded-lg bg-blue-600 px-3 font-bold text-white">
                {rows.reduce((s, r) => s + r.total, 0)}
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="flex flex-wrap items-center justify-center gap-3 border-t border-slate-100 px-5 py-3 dark:border-slate-800">
        <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
          Intensity:
        </span>
        <div className="flex items-center gap-1">
          <span className="h-4 w-4 rounded bg-blue-100" />
          <span className="text-[10px] text-slate-500 dark:text-slate-400">Low</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-4 w-4 rounded bg-blue-300" />
        </div>
        <div className="flex items-center gap-1">
          <span className="h-4 w-4 rounded bg-blue-500" />
        </div>
        <div className="flex items-center gap-1">
          <span className="h-4 w-4 rounded bg-blue-700" />
          <span className="text-[10px] text-slate-500 dark:text-slate-400">High</span>
        </div>
      </div>
    </div>
  );
}

// ============ GRADIENT STACKED BAR ============
function GradientStackedBar({
  rows,
}: {
  rows: {
    label: string;
    segments: { label: string; value: number; gradient: string }[];
    total: number;
  }[];
}) {
  return (
    <div className="space-y-5 p-5">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {row.label}
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {row.total} total
            </span>
          </div>

          <div className="flex h-9 w-full overflow-hidden rounded-lg bg-slate-100 shadow-inner dark:bg-slate-800">
            {row.segments.map((seg) => {
              const width = row.total > 0 ? (seg.value / row.total) * 100 : 0;
              if (width === 0) return null;
              return (
                <div
                  key={seg.label}
                  className={`group relative flex items-center justify-center text-[11px] font-bold text-white transition-all hover:brightness-110 ${seg.gradient}`}
                  style={{ width: `${width}%` }}
                  title={`${seg.label}: ${seg.value}`}
                >
                  {width >= 6 && seg.value > 0 && <span>{seg.value}</span>}
                </div>
              );
            })}
          </div>

          <div className="mt-2 flex flex-wrap gap-3">
            {row.segments.map((seg) => (
              <div
                key={seg.label}
                className="flex items-center gap-1.5 text-[10px]"
              >
                <span className={`h-2.5 w-2.5 rounded-full ${seg.gradient}`} />
                <span className="text-slate-500 dark:text-slate-400">
                  {seg.label}:{' '}
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {seg.value}
                  </span>{' '}
                  <span className="text-slate-400 dark:text-slate-500">
                    (
                    {row.total > 0
                      ? ((seg.value / row.total) * 100).toFixed(0)
                      : 0}
                    %)
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
        <div className="flex flex-wrap justify-center gap-4 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-6 rounded bg-gradient-to-r from-emerald-400 to-emerald-600" />
            <span className="font-medium text-slate-600 dark:text-slate-400">
              Enrolled
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-6 rounded bg-gradient-to-r from-amber-400 to-amber-500" />
            <span className="font-medium text-slate-600 dark:text-slate-400">
              Pending
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-6 rounded bg-gradient-to-r from-red-400 to-red-600" />
            <span className="font-medium text-slate-600 dark:text-slate-400">
              Cancelled
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}