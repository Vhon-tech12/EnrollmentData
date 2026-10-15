// components/ui/Badge.tsx
import React from 'react';

export type BadgeTone =
  | 'brand'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'
  | 'neutral';

const TONE_CLASSES: Record<BadgeTone, string> = {
  brand:
    'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 dark:border dark:border-blue-500/20',
  info:
    'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400 dark:border dark:border-sky-500/20',
  success:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border dark:border-emerald-500/20',
  warning:
    'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 dark:border dark:border-amber-500/20',
  danger:
    'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 dark:border dark:border-red-500/20',
  neutral:
    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:border dark:border-slate-700',
};

const DOT_CLASSES: Record<BadgeTone, string> = {
  brand: 'bg-blue-600 dark:bg-blue-400',
  info: 'bg-sky-600 dark:bg-sky-400',
  success: 'bg-emerald-600 dark:bg-emerald-400',
  warning: 'bg-amber-600 dark:bg-amber-400',
  danger: 'bg-red-600 dark:bg-red-400',
  neutral: 'bg-slate-600 dark:bg-slate-400',
};

interface BadgeProps {
  tone?: BadgeTone;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

export default function Badge({
  tone = 'neutral',
  dot = false,
  children,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${TONE_CLASSES[tone]} ${className}`}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${DOT_CLASSES[tone]}`}
        />
      )}
      {children}
    </span>
  );
}