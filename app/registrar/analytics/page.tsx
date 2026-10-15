'use client';

import { useState, useMemo } from 'react';
import {
  BarChart3,
  Users,
  Percent,
  TrendingUp,
  Layers,
  Inbox,
  Activity,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
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
import Button from '@/components/ui/Button';

const ACADEMIC_YEARS = ['2025-2026', '2024-2025', '2023-2024', '2022-2023', '2021-2022'];
const PROGRAMS = ['BSIT', 'BSCS', 'BSBA', 'BSA', 'BSED'];
const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const SECTIONS = ['A', 'B', 'C', 'D', 'E'];

const SELECT_CLASS =
  'h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 transition-colors hover:bg-slate-50 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200';

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

export default function RegistrarAnalyticsPage() {
  const { records, loading, error } = useEnrollments();
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);

  const analytics = useAnalytics(records, {
    academicYear: filters.academicYear,
    program: filters.program,
    yearLevel: filters.yearLevel,
    section: filters.section,
  });

  // Trend data — all academic years, chronological
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

  // Year level trend
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
                Import an Excel or CSV file on the Enrollment page, and the
                analytics will automatically update based on your data.
              </p>
              <Link href="/registrar/enrollment" className="mt-5">
                <Button>Go to Enrollment</Button>
              </Link>
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

      {/* KPI Cards — violet theme */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total Records"
          value={analytics.total.toLocaleString()}
          hint="Matching filters"
          icon={<Users className="h-5 w-5" />}
          accent="bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400"
        />
        <KpiCard
          label="Enrollment Rate"
          value={`${analytics.enrollmentRate.toFixed(1)}%`}
          hint={`${analytics.enrolled} enrolled`}
          icon={<Percent className="h-5 w-5" />}
          accent="bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-950/60 dark:text-fuchsia-400"
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
          icon={<Layers className="h-5 w-5" />}
          accent="bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400"
        />
      </div>

      {/* PRIMARY GRADIENT LINE CHART — Purple/Violet theme */}
      <Card className="shadow-lg">
        <CardHeader
          title="Enrollment Trend by Academic Year"
          subtitle="Total records vs confirmed enrollments (last 5 academic years)"
          action={
            <span className="inline-flex items-center gap-1.5 rounded-md bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 dark:bg-violet-950/60 dark:text-violet-400">
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
            <span className="inline-flex items-center gap-1.5 rounded-md bg-fuchsia-50 px-2.5 py-1 text-xs font-medium text-fuchsia-700 dark:bg-fuchsia-950/60 dark:text-fuchsia-400">
              <Activity className="h-3.5 w-3.5" />
              Distribution
            </span>
          }
        />
        <CardBody>
          <GradientLineChart data={yearLevelTrend} variant="single" />
        </CardBody>
      </Card>

      {/* Program + Year Level */}
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
            subtitle="Distribution across year levels"
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
    </div>
  );
}

// ============ HEADER ============
function Header({ recordCount }: { recordCount?: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400">
        <BarChart3 className="h-5 w-5" />
      </span>
      <div>
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Enrollment Analytics
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {recordCount !== undefined
            ? `Auto-generated from ${recordCount} record${recordCount !== 1 ? 's' : ''} in Firestore.`
            : 'Analyze enrollment data by academic year, program, year level, and section.'}
        </p>
      </div>
    </div>
  );
}

// ============ GRADIENT LINE CHART — Purple/Violet Theme ============
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

  const gradId = variant === 'dual' ? 'registrar' : 'registrar-single';

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-80 w-full">
        <defs>
          {/* Total area gradient — violet */}
          <linearGradient id={`${gradId}-totalArea`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.45" />
            <stop offset="50%" stopColor="#7c3aed" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
          </linearGradient>

          {/* Enrolled area gradient — fuchsia/pink */}
          <linearGradient id={`${gradId}-enrolledArea`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d946ef" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#d946ef" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#d946ef" stopOpacity="0" />
          </linearGradient>

          {/* Total line gradient — deep violet → purple → light purple */}
          <linearGradient id={`${gradId}-totalLine`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#5b21b6" />
            <stop offset="50%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>

          {/* Enrolled line gradient — pink */}
          <linearGradient id={`${gradId}-enrolledLine`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#c026d3" />
            <stop offset="100%" stopColor="#f0abfc" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
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

        {/* Area fills */}
        <path d={totalArea} fill={`url(#${gradId}-totalArea)`} />
        {variant === 'dual' && (
          <path d={enrolledArea} fill={`url(#${gradId}-enrolledArea)`} />
        )}

        {/* Total line */}
        <polyline
          points={totalPts}
          fill="none"
          stroke={`url(#${gradId}-totalLine)`}
          strokeWidth="3.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Enrolled line */}
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

        {/* Pending dashed */}
        {variant === 'single' && data.some((d) => (d.pending ?? 0) > 0) && (
          <polyline
            points={pendingPts}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeDasharray="6 4"
            strokeLinecap="round"
          />
        )}

        {/* Data points — Total */}
        {data.map((d, i) => (
          <g key={`d-${i}`}>
            <circle
              cx={x(i)}
              cy={y(d.total)}
              r="7"
              fill="white"
              stroke="#7c3aed"
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
                className="text-violet-800 dark:text-violet-300"
              >
                {d.total}
              </text>
            )}
          </g>
        ))}

        {/* Data points — Enrolled */}
        {variant === 'dual' &&
          data.map((d, i) => (
            <circle
              key={`e-${i}`}
              cx={x(i)}
              cy={y(d.enrolled)}
              r="5"
              fill="white"
              stroke="#d946ef"
              strokeWidth="2.5"
              className="dark:fill-slate-900"
            />
          ))}

        {/* X-axis labels */}
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

      {/* Legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <span
            className="h-3 w-3 rounded-full"
            style={{ background: 'linear-gradient(90deg, #5b21b6, #a78bfa)' }}
          />
          <span className="font-medium text-slate-700 dark:text-slate-300">
            Total Records
          </span>
        </div>
        {variant === 'dual' && (
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ background: 'linear-gradient(90deg, #c026d3, #f0abfc)' }}
            />
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Enrolled
            </span>
          </div>
        )}
        {variant === 'single' && (
          <div className="flex items-center gap-2">
            <span className="h-0.5 w-3 rounded-full bg-amber-500" />
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Pending
            </span>
          </div>
        )}
      </div>
    </div>
  );
}