import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export default function Card({ children, className = '' }: CardProps) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white shadow-[0_2px_12px_-4px_rgba(15,23,42,0.08),0_1px_3px_0_rgba(15,23,42,0.04)] transition-shadow duration-200 hover:shadow-[0_4px_20px_-4px_rgba(15,23,42,0.12),0_2px_6px_-2px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-none dark:hover:shadow-lg dark:hover:shadow-black/40 ${className}`}
    >
      {children}
    </section>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

export function CardBody({ children, className = '' }: CardProps) {
  return <div className={`px-5 py-5 ${className}`}>{children}</div>;
}