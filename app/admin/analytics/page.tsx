'use client';

import { useState, useMemo } from 'react';
import {
  BarChart3,
  Users,
  Percent,
  TrendingUp,
  TrendingDown,
  Building2,
  Inbox,
  Lock,
  AlertCircle,
  Award,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Activity,
  Star,
} from 'lucide-react';
import { useEnrollments } from '@/lib/useEnrollments';
import { useAnalytics } from '@/lib/useAnalytics';
import {
  EmptyChart,
  LoadingChart,
} from '@/components/analytics/Charts';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';

const ACADEMIC_YEARS = ['2025-2026', '2024-2025', '2023-2024', '2022-2023', '2021-2022'];
const PROGRAMS = ['BSIT', 'BSCS', 'BSBA', 'BSA', 'BSED'];
const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

const PROGRAM_COLORS: Record<string, string> = {
  BSIT: 'bg-blue-500',
  BSCS: 'bg-sky-500',
  BSBA: 'bg-indigo-500',
  BSA: 'bg-violet-500',
  BSED: 'bg-teal-500',
};

interface FilterState {
  academicYear: string;
  program: string;
}

const EMPTY_FILTERS: FilterState = {
  academicYear: '',
  program: '',
};

export default function AdminAnalyticsPage() {
  const { records, loading, error } = useEnrollments();
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);

  const analytics = useAnalytics(records, {
    academicYear: filters.academicYear,
    program: filters.program,
  });

  // ============ EXECUTIVE ANALYTICS ============

  // YoY Comparison — current year vs previous year
  const yoyComparison = useMemo(() => {
    const currentAY = ACADEMIC_YEARS[0];
    const previousAY = ACADEMIC_YEARS[1];

    const currentRows = records.filter((r) => r.academicYear === currentAY);
    const previousRows = records.filter((r) => r.academicYear === previousAY);

    const byProgram = PROGRAMS.map((p) => {
      const current = currentRows.filter((r) => r.program === p).length;
      const previous = previousRows.filter((r) => r.program === p).length;
      const diff = current - previous;
      const growth = previous > 0 ? (diff / previous) * 100 : 0;
      return {
        program: p,
        current,
        previous,
        diff,
        growth,
      };
    }).filter((d) => d.current > 0 || d.previous > 0);

    return { currentAY, previousAY, byProgram };
  }, [records]);

  // Program ranking (with enrollment rate)
  const programRanking = useMemo(() => {
    const data = PROGRAMS.map((p) => {
      const rows = analytics.filtered.filter((r) => r.program === p);
      const enrolled = rows.filter((r) => r.status === 'Enrolled').length;
      const rate = rows.length > 0 ? (enrolled / rows.length) * 100 : 0;
      return {
        program: p,
        total: rows.length,
        enrolled,
        rate,
        color: PROGRAM_COLORS[p] ?? 'bg-blue-500',
      };
    })
      .filter((d) => d.total > 0)
      .sort((a, b) => b.total - a.total);

    const maxTotal = Math.max(...data.map((d) => d.total), 1);
    return { data, maxTotal };
  }, [analytics.filtered]);

  // Section ranking
  const sectionRanking = useMemo(() => {
    const sections = ['A', 'B', 'C', 'D', 'E'];
    const data = sections
      .map((s) => {
        const rows = analytics.filtered.filter((r) => r.section === s);
        return {
          section: `Section ${s}`,
          total: rows.length,
        };
      })
      .filter((d) => d.total > 0)
      .sort((a, b) => b.total - a.total);

    const maxTotal = Math.max(...data.map((d) => d.total), 1);
    return { data, maxTotal };
  }, [analytics.filtered]);

  // Year level distribution with percentages
  const yearLevelDistribution = useMemo(() => {
    const total = analytics.total || 1;
    return YEAR_LEVELS.map((y) => {
      const count = analytics.filtered.filter((r) => r.yearLevel === y).length;
      return {
        year: y,
        count,
        percentage: (count / total) * 100,
      };
    }).filter((d) => d.count > 0);
  }, [analytics.filtered, analytics.total]);

  // Best & worst programs by enrollment rate
  const rateExtremes = useMemo(() => {
    const withRates = PROGRAMS.map((p) => {
      const rows = analytics.filtered.filter((r) => r.program === p);
      const enrolled = rows.filter((r) => r.status === 'Enrolled').length;
      const rate = rows.length > 0 ? (enrolled / rows.length) * 100 : 0;
      return { program: p, rate, total: rows.length };
    }).filter((d) => d.total > 0);

    if (withRates.length === 0) return null;

    const sorted = [...withRates].sort((a, b) => b.rate - a.rate);
    return {
      best: sorted[0],
      worst: sorted[sorted.length - 1],
    };
  }, [analytics.filtered]);

  // Trend for area chart (last 5 years, one line only)
  const trendData = useMemo(() => {
    return [...ACADEMIC_YEARS].reverse().map((ay) => {
      const rows = records.filter((r) => {
        if (filters.program && r.program !== filters.program) return false;
        return r.academicYear === ay;
      });
      return {
        year: ay,
        enrolled: rows.filter((r) => r.status === 'Enrolled').length,
        total: rows.length,
      };
    });
  }, [records, filters]);

  const update = (key: keyof FilterState, value: string) =>
    setFilters({ ...filters, [key]: value });

  const hasActiveFilters = Boolean(filters.academicYear || filters.program);

  // ============ STATES ============
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
                Wala pang enrollment data
              </h3>
              <p className="mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400">
                Analytics will populate once the Registrar imports enrollment data.
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

      {/* Read-only notice */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/40">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
            <Lock className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-semibold text-blue-900 dark:text-blue-300">
              Management View
            </p>
            <p className="mt-0.5 text-xs text-blue-700 dark:text-blue-400">
              Executive-level analytics for decision-making. Read-only — para sa
              monitoring at trend analysis.
            </p>
          </div>
        </div>
      </div>

      {/* ============ EXECUTIVE SUMMARY ============ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ExecutiveKpi
          label="Total Enrollment"
          value={analytics.total.toLocaleString()}
          comparison={`vs ${yoyComparison.previousAY}`}
          change={yoyComparison.byProgram.reduce((s, d) => s + d.diff, 0)}
          icon={<Users className="h-5 w-5" />}
          accent="emerald"
        />
        <ExecutiveKpi
          label="Enrollment Rate"
          value={`${analytics.enrollmentRate.toFixed(1)}%`}
          comparison="of total records"
          highlight
          icon={<Target className="h-5 w-5" />}
          accent="teal"
        />
        <ExecutiveKpi
          label="Programs Active"
          value={`${programRanking.data.length}`}
          comparison="with enrollment data"
          icon={<Building2 className="h-5 w-5" />}
          accent="amber"
        />
        <ExecutiveKpi
          label="Top Section"
          value={sectionRanking.data[0]?.section ?? '—'}
          comparison={`${sectionRanking.data[0]?.total ?? 0} students`}
          icon={<Award className="h-5 w-5" />}
          accent="violet"
        />
      </div>

      {/* ============ FILTERS ============ */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Filters:
          </span>

          <select
            value={filters.academicYear}
            onChange={(e) => update('academicYear', e.target.value)}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 transition-colors hover:bg-slate-50 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="">All Academic Years</option>
            {ACADEMIC_YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <select
            value={filters.program}
            onChange={(e) => update('program', e.target.value)}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 transition-colors hover:bg-slate-50 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="">All Programs</option>
            {PROGRAMS.map((p) => (
              <option key={p} value={p}>{p}</option>
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
      </div>

      {/* ============ ENROLLMENT RATE GAUGE + YEAR LEVEL DISTRIBUTION ============ */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Gauge */}
        <Card className="shadow-lg">
          <CardHeader
            title="Enrollment Rate"
            subtitle="Percentage of records confirmed"
          />
          <CardBody>
            <EnrollmentGauge rate={analytics.enrollmentRate} />
          </CardBody>
        </Card>

        {/* Year Level Distribution */}
        <Card className="shadow-lg xl:col-span-2">
          <CardHeader
            title="Year Level Distribution"
            subtitle="Percentage breakdown of students per year level"
          />
          <CardBody>
            <DistributionList items={yearLevelDistribution} />
          </CardBody>
        </Card>
      </div>

      {/* ============ PROGRAM RANKING ============ */}
      <Card className="shadow-lg">
        <CardHeader
          title="Program Ranking"
          subtitle="Programs ranked by enrollment volume with confirmation rate"
          action={
            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
              <Award className="h-3.5 w-3.5" />
              Ranking
            </span>
          }
        />
        <CardBody className="px-0 py-0">
          <RankingTable ranking={programRanking} />
        </CardBody>
      </Card>

      {/* ============ YEAR-OVER-YEAR COMPARISON ============ */}
      <Card className="shadow-lg">
        <CardHeader
          title="Year-over-Year Comparison"
          subtitle={`${yoyComparison.currentAY} vs ${yoyComparison.previousAY} — program-level growth`}
          action={
            <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
              <Activity className="h-3.5 w-3.5" />
              YoY
            </span>
          }
        />
        <CardBody className="px-0 py-0">
          <YoYComparisonTable data={yoyComparison.byProgram} />
        </CardBody>
      </Card>

      {/* ============ SECTION RANKING + RATE EXTREMES ============ */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader
            title="Section Ranking"
            subtitle="Sections ranked by enrollment volume"
          />
          <CardBody>
            <SectionBars ranking={sectionRanking} />
          </CardBody>
        </Card>

        <Card className="shadow-lg">
          <CardHeader
            title="Program Performance"
            subtitle="Best and least performing programs by enrollment rate"
          />
          <CardBody>
            {rateExtremes ? (
              <PerformanceCards extremes={rateExtremes} />
            ) : (
              <EmptyChart />
            )}
          </CardBody>
        </Card>
      </div>

      {/* ============ TREND AREA CHART ============ */}
      <Card className="shadow-lg">
        <CardHeader
          title="5-Year Enrollment Trend"
          subtitle="Total records and confirmed enrollments over the last 5 academic years"
          action={
            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
              <Activity className="h-3.5 w-3.5" />
              Area
            </span>
          }
        />
        <CardBody>
          <AreaTrendChart data={trendData} />
        </CardBody>
      </Card>

      {/* ============ MANAGEMENT INSIGHTS ============ */}
      <Card className="shadow-lg">
        <CardHeader
          title="Management Insights"
          subtitle="Auto-generated observations for decision-making"
        />
        <CardBody>
          <ManagementInsights
            analytics={analytics}
            yoyComparison={yoyComparison}
            programRanking={programRanking.data}
            rateExtremes={rateExtremes}
          />
        </CardBody>
      </Card>
    </div>
  );
}

// ============ HEADER ============
function Header({ recordCount }: { recordCount?: number }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
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
              ? `Executive analytics from ${recordCount} record${recordCount !== 1 ? 's' : ''}.`
              : 'Institution-wide enrollment analysis.'}
          </p>
        </div>
      </div>

      <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 dark:border-blue-900 dark:bg-blue-950/40">
        <Lock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
        <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Read-only</span>
      </span>
    </div>
  );
}

// ============ EXECUTIVE KPI ============
function ExecutiveKpi({
  label,
  value,
  comparison,
  change,
  icon,
  accent,
  highlight,
}: {
  label: string;
  value: string;
  comparison: string;
  change?: number;
  icon: React.ReactNode;
  accent: 'emerald' | 'teal' | 'amber' | 'violet';
  highlight?: boolean;
}) {
  const ACCENTS = {
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
    teal: 'bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400',
  };

  return (
    <div
      className={`rounded-2xl border bg-white p-5 shadow-md transition-shadow hover:shadow-lg dark:bg-slate-900 ${
        highlight
          ? 'border-emerald-300 dark:border-emerald-800'
          : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{comparison}</p>
        </div>
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${ACCENTS[accent]}`}
        >
          {icon}
        </span>
      </div>

      {typeof change === 'number' && (
        <div className="mt-4 flex items-center gap-1.5 border-t border-slate-100 pt-3 dark:border-slate-800">
          {change > 0 ? (
            <>
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                <ArrowUpRight className="h-3.5 w-3.5" />+{change}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">vs previous</span>
            </>
          ) : change < 0 ? (
            <>
              <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-1.5 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-950/60 dark:text-red-400">
                <ArrowDownRight className="h-3.5 w-3.5" />{change}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">vs previous</span>
            </>
          ) : (
            <>
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                <Minus className="h-3.5 w-3.5" />0
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">no change</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ============ ENROLLMENT GAUGE ============
function EnrollmentGauge({ rate }: { rate: number }) {
  const radius = 70;
  const C = Math.PI * radius; // half circle
  const progress = (rate / 100) * C;

  return (
    <div className="flex flex-col items-center py-4">
      <div className="relative">
        <svg viewBox="0 0 180 100" className="h-44 w-full max-w-[280px]">
          <defs>
            <linearGradient id="gauge-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#047857" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#6ee7b7" />
            </linearGradient>
          </defs>

          {/* Background track */}
          <path
            d={`M 20 90 A ${radius} ${radius} 0 0 1 160 90`}
            fill="none"
            stroke="currentColor"
            className="text-slate-100 dark:text-slate-800"
            strokeWidth="16"
            strokeLinecap="round"
          />

          {/* Progress */}
          <path
            d={`M 20 90 A ${radius} ${radius} 0 0 1 160 90`}
            fill="none"
            stroke="url(#gauge-grad)"
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={`${progress} ${C}`}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
          <span className="bg-gradient-to-br from-emerald-600 to-teal-500 bg-clip-text text-3xl font-bold text-transparent">
            {rate.toFixed(1)}%
          </span>
          <span className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Confirmed
          </span>
        </div>
      </div>

      <p className="mt-4 max-w-xs text-center text-xs text-slate-500 dark:text-slate-400">
        {rate >= 90
          ? 'Excellent enrollment confirmation rate.'
          : rate >= 70
            ? 'Healthy enrollment confirmation rate.'
            : 'Consider reviewing pending records.'}
      </p>
    </div>
  );
}

// ============ DISTRIBUTION LIST ============
function DistributionList({
  items,
}: {
  items: { year: string; count: number; percentage: number }[];
}) {
  return (
    <div className="space-y-4 py-2">
      {items.map((item) => (
        <div key={item.year}>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {item.year}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {item.count} students
              </span>
              <span className="min-w-[48px] text-right text-sm font-semibold text-slate-900 dark:text-slate-100">
                {item.percentage.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
              style={{ width: `${item.percentage}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============ RANKING TABLE ============
function RankingTable({
  ranking,
}: {
  ranking: {
    data: { program: string; total: number; enrolled: number; rate: number; color: string }[];
    maxTotal: number;
  };
}) {
  if (ranking.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Inbox className="h-6 w-6 text-slate-400 dark:text-slate-500" />
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">No program data available.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <th className="px-5 py-3 font-semibold">#</th>
            <th className="px-5 py-3 font-semibold">Program</th>
            <th className="px-5 py-3 font-semibold">Volume</th>
            <th className="px-5 py-3 text-right font-semibold">Enrolled</th>
            <th className="px-5 py-3 text-right font-semibold">Rate</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {ranking.data.map((row, i) => {
            const isTop = i === 0;
            const widthPct = (row.total / ranking.maxTotal) * 100;
            return (
              <tr
                key={row.program}
                className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/50"
              >
                <td className="whitespace-nowrap px-5 py-3">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      isTop
                        ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {i + 1}
                  </span>
                </td>
                <td className="whitespace-nowrap px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className={`h-2.5 w-2.5 rounded-full ${row.color}`} />
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {row.program}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-40 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className={`h-full rounded-full ${row.color}`}
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {row.total}
                    </span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-5 py-3 text-right text-emerald-700 dark:text-emerald-400">
                  {row.enrolled}
                </td>
                <td className="whitespace-nowrap px-5 py-3 text-right">
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${
                      row.rate >= 90
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                        : row.rate >= 70
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                          : 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400'
                    }`}
                  >
                    {row.rate.toFixed(1)}%
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ============ YOY COMPARISON TABLE ============
function YoYComparisonTable({
  data,
}: {
  data: { program: string; current: number; previous: number; diff: number; growth: number }[];
}) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-xs text-slate-500 dark:text-slate-400">No comparison data available.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <th className="px-5 py-3 font-semibold">Program</th>
            <th className="px-5 py-3 text-right font-semibold">Previous</th>
            <th className="px-5 py-3 text-right font-semibold">Current</th>
            <th className="px-5 py-3 text-right font-semibold">Change</th>
            <th className="px-5 py-3 text-right font-semibold">Growth</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {data.map((row) => (
            <tr
              key={row.program}
              className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/50"
            >
              <td className="whitespace-nowrap px-5 py-3 font-medium text-slate-800 dark:text-slate-200">
                {row.program}
              </td>
              <td className="whitespace-nowrap px-5 py-3 text-right text-slate-600 dark:text-slate-400">
                {row.previous}
              </td>
              <td className="whitespace-nowrap px-5 py-3 text-right font-semibold text-slate-900 dark:text-slate-100">
                {row.current}
              </td>
              <td className="whitespace-nowrap px-5 py-3 text-right">
                {row.diff > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                    <ArrowUpRight className="h-3.5 w-3.5" />+{row.diff}
                  </span>
                ) : row.diff < 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-1.5 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-950/60 dark:text-red-400">
                    <ArrowDownRight className="h-3.5 w-3.5" />
                    {row.diff}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    <Minus className="h-3.5 w-3.5" />0
                  </span>
                )}
              </td>
              <td className="whitespace-nowrap px-5 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400">
                {row.growth >= 0 ? '+' : ''}
                {row.growth.toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============ SECTION BARS ============
function SectionBars({
  ranking,
}: {
  ranking: { data: { section: string; total: number }[]; maxTotal: number };
}) {
  if (ranking.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-xs text-slate-500 dark:text-slate-400">No section data available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-2">
      {ranking.data.map((item, i) => {
        const widthPct = (item.total / ranking.maxTotal) * 100;
        const isTop = i === 0;
        return (
          <div key={item.section}>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {isTop && <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />}
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {item.section}
                </span>
              </div>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {item.total}
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className={`h-full rounded-full ${
                  isTop
                    ? 'bg-gradient-to-r from-amber-400 to-amber-600'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                }`}
                style={{ width: `${widthPct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============ PERFORMANCE CARDS ============
function PerformanceCards({
  extremes,
}: {
  extremes: { best: { program: string; rate: number; total: number }; worst: { program: string; rate: number; total: number } };
}) {
  return (
    <div className="space-y-4 py-2">
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 dark:border-emerald-900 dark:from-emerald-950/40 dark:to-slate-900">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
            <Award className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
              Top Performer
            </p>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {extremes.best.program}
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-emerald-100 pt-3 dark:border-emerald-900/50">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Confirmation Rate
            </p>
            <p className="mt-0.5 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {extremes.best.rate.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Total Students
            </p>
            <p className="mt-0.5 text-2xl font-bold text-slate-900 dark:text-slate-100">
              {extremes.best.total}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 dark:border-amber-900 dark:from-amber-950/40 dark:to-slate-900">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
            <AlertCircle className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
              Needs Attention
            </p>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {extremes.worst.program}
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-amber-100 pt-3 dark:border-amber-900/50">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Confirmation Rate
            </p>
            <p className="mt-0.5 text-2xl font-bold text-amber-600 dark:text-amber-400">
              {extremes.worst.rate.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Total Students
            </p>
            <p className="mt-0.5 text-2xl font-bold text-slate-900 dark:text-slate-100">
              {extremes.worst.total}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ AREA TREND CHART ============
function AreaTrendChart({
  data,
}: {
  data: { year: string; enrolled: number; total: number }[];
}) {
  if (data.length === 0) return null;

  const W = 900;
  const H = 300;
  const P = { t: 30, r: 30, b: 50, l: 60 };
  const cw = W - P.l - P.r;
  const ch = H - P.t - P.b;

  const maxVal = Math.max(...data.map((d) => d.total), 1);
  const yMax = Math.max(Math.ceil((maxVal * 1.15) / 5) * 5, 5);
  const xStep = data.length > 1 ? cw / (data.length - 1) : 0;

  const x = (i: number) => P.l + i * xStep + (data.length === 1 ? cw / 2 : 0);
  const y = (v: number) => P.t + ch - (v / yMax) * ch;

  const totalPts = data.map((d, i) => `${x(i)},${y(d.total)}`).join(' ');
  const enrolledPts = data.map((d, i) => `${x(i)},${y(d.enrolled)}`).join(' ');

  const totalArea =
    `M ${x(0)},${y(0)} ` +
    data.map((d, i) => `L ${x(i)},${y(d.total)}`).join(' ') +
    ` L ${x(data.length - 1)},${y(0)} Z`;

  const enrolledArea =
    `M ${x(0)},${y(0)} ` +
    data.map((d, i) => `L ${x(i)},${y(d.enrolled)}`).join(' ') +
    ` L ${x(data.length - 1)},${y(0)} Z`;

  const gridLines = [0, yMax / 4, yMax / 2, (yMax * 3) / 4, yMax].map((v) => Math.round(v));

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-72 w-full">
        <defs>
          <linearGradient id="trend-totalArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="trend-enrolledArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
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

        <path d={totalArea} fill="url(#trend-totalArea)" />
        <path d={enrolledArea} fill="url(#trend-enrolledArea)" />

        <polyline
          points={totalPts}
          fill="none"
          stroke="#10b981"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <polyline
          points={enrolledPts}
          fill="none"
          stroke="#f59e0b"
          strokeWidth="2"
          strokeDasharray="5 4"
        />

        {data.map((d, i) => (
          <circle
            key={d.year}
            cx={x(i)}
            cy={y(d.total)}
            r="4"
            fill="white"
            stroke="#10b981"
            strokeWidth="2"
            className="dark:fill-slate-900"
          />
        ))}

        {data.map((d, i) => (
          <text
            key={`l-${d.year}`}
            x={x(i)}
            y={H - 20}
            textAnchor="middle"
            fontSize="11"
            fill="currentColor"
            className="text-slate-500 dark:text-slate-400"
          >
            {d.year}
          </text>
        ))}
      </svg>

      <div className="mt-4 flex flex-wrap justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-emerald-500" />
          <span className="font-medium text-slate-700 dark:text-slate-300">Total Records</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-amber-500" />
          <span className="font-medium text-slate-700 dark:text-slate-300">Enrolled</span>
        </div>
      </div>
    </div>
  );
}

// ============ MANAGEMENT INSIGHTS ============
function ManagementInsights({
  analytics,
  yoyComparison,
  programRanking,
  rateExtremes,
}: {
  analytics: ReturnType<typeof useAnalytics>;
  yoyComparison: { currentAY: string; previousAY: string; byProgram: { program: string; diff: number; growth: number }[] };
  programRanking: { program: string; total: number; rate: number }[];
  rateExtremes: { best: { program: string; rate: number; total: number }; worst: { program: string; rate: number; total: number } } | null;
}) {
  const insights: { icon: typeof Activity; text: string; tone: string }[] = [];

  // Biggest grower
  const biggestGrower = [...yoyComparison.byProgram].sort((a, b) => b.growth - a.growth)[0];
  if (biggestGrower && biggestGrower.growth > 0) {
    insights.push({
      icon: TrendingUp,
      text: `${biggestGrower.program} shows the strongest growth at ${biggestGrower.growth.toFixed(1)}% year-over-year (+${biggestGrower.diff} records).`,
      tone: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
    });
  }

  // Biggest decliner
  const biggestDecliner = [...yoyComparison.byProgram].sort((a, b) => a.growth - b.growth)[0];
  if (biggestDecliner && biggestDecliner.growth < 0) {
    insights.push({
      icon: TrendingDown,
      text: `${biggestDecliner.program} declined by ${Math.abs(biggestDecliner.growth).toFixed(1)}% year-over-year (${biggestDecliner.diff} records). Consider reviewing recruitment strategies.`,
      tone: 'bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400',
    });
  }

  // Top program
  if (programRanking.length > 0) {
    const top = programRanking[0];
    insights.push({
      icon: Award,
      text: `${top.program} is the largest program with ${top.total} total enrollment records.`,
      tone: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
    });
  }

  // Rate comparison
  if (rateExtremes && rateExtremes.best.rate - rateExtremes.worst.rate > 10) {
    const gap = rateExtremes.best.rate - rateExtremes.worst.rate;
    insights.push({
      icon: AlertCircle,
      text: `Significant gap of ${gap.toFixed(1)}% between ${rateExtremes.best.program} (${rateExtremes.best.rate.toFixed(1)}%) and ${rateExtremes.worst.program} (${rateExtremes.worst.rate.toFixed(1)}%) enrollment confirmation rates.`,
      tone: 'bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400',
    });
  }

  // Overall trend
  const totalGrowth = yoyComparison.byProgram.reduce((s, d) => s + d.growth, 0) / Math.max(yoyComparison.byProgram.length, 1);
  if (Math.abs(totalGrowth) > 0.5) {
    insights.push({
      icon: Activity,
      text: `Overall average program growth is ${totalGrowth >= 0 ? '+' : ''}${totalGrowth.toFixed(1)}% year-over-year.`,
      tone: totalGrowth >= 0 ? 'bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400' : 'bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400',
    });
  }

  if (insights.length === 0) {
    return (
      <p className="text-center text-xs text-slate-500 dark:text-slate-400 py-6">
        No insights available yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {insights.map((item, i) => {
        const Icon = item.icon;
        return (
          <div
            key={i}
            className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800"
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.tone}`}
            >
              <Icon className="h-4 w-4" />
            </span>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {item.text}
            </p>
          </div>
        );
      })}
    </div>
  );
}