'use client';

import type { ReactNode } from 'react';

// ============ KPI CARD ============
export function KpiCard({
  label,
  value,
  hint,
  icon,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  icon: ReactNode;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md transition-shadow hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:shadow-none dark:hover:shadow-lg dark:hover:shadow-black/40">
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

// ============ TREND LINE CHART ============
export function TrendLineChart({
  data,
}: {
  data: { year: string; enrolled: number; total: number }[];
}) {
  if (data.length === 0) return <EmptyChart />;

  const W = 700;
  const H = 300;
  const P = { t: 20, r: 20, b: 40, l: 55 };
  const cw = W - P.l - P.r;
  const ch = H - P.t - P.b;

  const maxVal = Math.max(...data.map((d) => d.total), 1);
  const yMax = Math.ceil(maxVal / 50) * 50 || 50;
  const xStep = data.length > 1 ? cw / (data.length - 1) : 0;

  const x = (i: number) => P.l + i * xStep + (data.length === 1 ? cw / 2 : 0);
  const y = (v: number) => P.t + ch - (v / yMax) * ch;

  const totalPts = data.map((d, i) => `${x(i)},${y(d.total)}`).join(' ');
  const enrolledPts = data.map((d, i) => `${x(i)},${y(d.enrolled)}`).join(' ');
  const gridLines = [0, yMax / 3, (yMax * 2) / 3, yMax].map((v) => Math.round(v));

  // Gradient area paths
  const totalArea =
    `M ${x(0)},${y(0)} ` +
    data.map((d, i) => `L ${x(i)},${y(d.total)}`).join(' ') +
    ` L ${x(data.length - 1)},${y(0)} Z`;

  const enrolledArea =
    `M ${x(0)},${y(0)} ` +
    data.map((d, i) => `L ${x(i)},${y(d.enrolled)}`).join(' ') +
    ` L ${x(data.length - 1)},${y(0)} Z`;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-80 w-full">
        <defs>
          <linearGradient id="trend-totalArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="trend-enrolledArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="trend-totalLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#1e40af" />
            <stop offset="100%" stopColor="#60a5fa" />
          </linearGradient>
          <linearGradient id="trend-enrolledLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0d9488" />
            <stop offset="100%" stopColor="#2dd4bf" />
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
              strokeDasharray="3 3"
            />
            <text
              x={P.l - 8}
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

        {data.map((d, i) => (
          <text
            key={d.year}
            x={x(i)}
            y={H - 15}
            textAnchor="middle"
            fontSize="11"
            fill="currentColor"
            className="text-slate-500 dark:text-slate-400"
          >
            {d.year}
          </text>
        ))}

        {/* Area fills */}
        <path d={totalArea} fill="url(#trend-totalArea)" />
        <path d={enrolledArea} fill="url(#trend-enrolledArea)" />

        {/* Lines */}
        <polyline
          points={totalPts}
          fill="none"
          stroke="url(#trend-totalLine)"
          strokeWidth="2.5"
        />
        {data.map((d, i) => (
          <circle
            key={`t-${i}`}
            cx={x(i)}
            cy={y(d.total)}
            r="3.5"
            fill="white"
            stroke="#2563eb"
            strokeWidth="2"
            className="dark:fill-slate-900"
          />
        ))}

        <polyline
          points={enrolledPts}
          fill="none"
          stroke="url(#trend-enrolledLine)"
          strokeWidth="2"
          strokeDasharray="5 4"
        />
      </svg>

      <div className="mt-3 flex flex-wrap justify-center gap-5 text-xs">
        <Legend color="#2563eb" label="Total Records" />
        <Legend color="#14b8a6" label="Enrolled" />
      </div>
    </div>
  );
}

// ============ HORIZONTAL BAR ============
export function HorizontalBarChart({
  data,
}: {
  data: { label: string; value: number; color: string }[];
}) {
  if (data.length === 0) return <EmptyChart />;
  const max = Math.max(...data.map((d) => d.value), 1);

  // Map bg-color class to gradient
  const getGradient = (color: string) => {
    if (color.includes('blue')) return 'from-blue-400 to-blue-600';
    if (color.includes('sky')) return 'from-sky-400 to-sky-600';
    if (color.includes('indigo')) return 'from-indigo-400 to-indigo-600';
    if (color.includes('violet')) return 'from-violet-400 to-violet-600';
    if (color.includes('teal')) return 'from-teal-400 to-teal-600';
    if (color.includes('emerald')) return 'from-emerald-400 to-emerald-600';
    if (color.includes('amber')) return 'from-amber-400 to-amber-600';
    if (color.includes('red')) return 'from-red-400 to-red-600';
    return 'from-blue-400 to-blue-600';
  };

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
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${getGradient(d.color)} shadow-sm`}
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============ VERTICAL BAR ============
export function VerticalBarChart({
  data,
}: {
  data: { label: string; value: number }[];
}) {
  if (data.length === 0) return <EmptyChart />;
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex h-64 items-end justify-around gap-3 px-2 pb-2">
      {data.map((d) => (
        <div
          key={d.label}
          className="flex h-full flex-1 flex-col items-center justify-end"
        >
          <span className="mb-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            {d.value}
          </span>
          <div
            className="w-full max-w-[56px] rounded-t-md bg-gradient-to-t from-blue-600 via-blue-500 to-blue-400 shadow-md transition-all hover:from-blue-700 hover:via-blue-600 hover:to-blue-500 dark:from-blue-700 dark:via-blue-600 dark:to-blue-500"
            style={{ height: `${(d.value / max) * 75}%` }}
          />
          <span className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ============ SECTION CHART ============
export function SectionChart({
  data,
}: {
  data: { label: string; value: number }[];
}) {
  if (data.length === 0) return <EmptyChart />;
  const max = Math.max(...data.map((d) => d.value), 1);

  // Progressive gradient — darker for higher values
  const gradients = [
    'from-blue-500 to-blue-700',
    'from-blue-400 to-blue-600',
    'from-blue-300 to-blue-500',
    'from-blue-200 to-blue-400',
    'from-blue-100 to-blue-300',
  ];

  return (
    <div className="space-y-3 py-2">
      {data.map((d, i) => (
        <div key={d.label}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {d.label}
            </span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {d.value} students
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${gradients[i % gradients.length]} shadow-sm`}
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============ DONUT ============
export function DonutChart({
  data,
  total,
}: {
  data: { label: string; value: number; color: string }[];
  total: number;
}) {
  if (data.length === 0 || total === 0) return <EmptyChart />;

  const radius = 60;
  const C = 2 * Math.PI * radius;
  let cumulative = 0;

  // Get gradient colors per segment
  const getGradientStops = (color: string) => {
    if (color === '#2563eb') return { from: '#3b82f6', to: '#1e40af' }; // blue
    if (color === '#f59e0b') return { from: '#fbbf24', to: '#d97706' }; // amber
    if (color === '#ef4444') return { from: '#f87171', to: '#dc2626' }; // red
    if (color === '#14b8a6') return { from: '#2dd4bf', to: '#0d9488' }; // teal
    if (color === '#10b981') return { from: '#34d399', to: '#059669' }; // emerald
    return { from: color, to: color };
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg viewBox="0 0 160 160" className="h-56 w-56 -rotate-90">
          <defs>
            {data.map((d, idx) => {
              const stops = getGradientStops(d.color);
              return (
                <linearGradient
                  key={`grad-${idx}`}
                  id={`donut-grad-${idx}`}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor={stops.from} />
                  <stop offset="100%" stopColor={stops.to} />
                </linearGradient>
              );
            })}
          </defs>

          {data.map((d, idx) => {
            const portion = (d.value / total) * C;
            const segment = (
              <circle
                key={d.label}
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke={`url(#donut-grad-${idx})`}
                strokeWidth="22"
                strokeDasharray={`${portion} ${C - portion}`}
                strokeDashoffset={-cumulative}
                strokeLinecap="round"
              />
            );
            cumulative += portion;
            return segment;
          })}
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="bg-gradient-to-br from-blue-600 to-teal-500 bg-clip-text text-2xl font-bold text-transparent dark:from-blue-400 dark:to-teal-400">
            {total.toLocaleString()}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Total Records
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs">
        {data.map((d, idx) => {
          const stops = getGradientStops(d.color);
          return (
            <div key={d.label} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  background: `linear-gradient(135deg, ${stops.from}, ${stops.to})`,
                }}
              />
              <span className="text-slate-600 dark:text-slate-300">
                {d.label}{' '}
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  ({((d.value / total) * 100).toFixed(1)}%)
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============ HELPERS ============
export function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="text-slate-600 dark:text-slate-300">{label}</span>
    </div>
  );
}

export function EmptyChart() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
        <span className="text-slate-400 dark:text-slate-500">—</span>
      </div>
      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        No data to display.
      </p>
    </div>
  );
}

export function LoadingChart() {
  return (
    <div className="flex items-center justify-center py-16">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600 dark:border-blue-900 dark:border-t-blue-500" />
    </div>
  );
}