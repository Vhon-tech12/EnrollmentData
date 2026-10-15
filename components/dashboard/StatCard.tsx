import type { ReactNode } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: ReactNode;
  trend?: number;
  accent?: 'brand' | 'emerald' | 'amber' | 'violet';
}

const ACCENTS: Record<NonNullable<StatCardProps['accent']>, string> = {
  brand: 'bg-blue-50 text-blue-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  violet: 'bg-violet-50 text-violet-600',
};

export default function StatCard({
  label,
  value,
  hint,
  icon,
  trend,
  accent = 'brand',
}: StatCardProps) {
  const isPositive = typeof trend === 'number' && trend >= 0;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            {value}
          </p>
          {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
        </div>
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${ACCENTS[accent]}`}
        >
          {icon}
        </span>
      </div>

      {typeof trend === 'number' && (
        <div className="mt-4 flex items-center gap-1.5 border-t border-slate-100 pt-3">
          <span
            className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold ${
              isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
            }`}
          >
            {isPositive ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            {isPositive ? '+' : ''}
            {trend.toFixed(1)}%
          </span>
          <span className="text-xs text-slate-500">vs previous year</span>
        </div>
      )}
    </section>
  );
}