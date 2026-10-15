'use client';

import { Search, Filter, X } from 'lucide-react';
import Button from '@/components/ui/Button';

export interface FilterState {
  search: string;
  academicYear: string;
  program: string;
  yearLevel: string;
  section: string;
  status: string;
}

interface EnrollmentFiltersProps {
  filters: FilterState;
  onChange: (next: FilterState) => void;
  onReset: () => void;
}

const ACADEMIC_YEARS = ['2025-2026', '2024-2025', '2023-2024', '2022-2023', '2021-2022'];
const PROGRAMS = ['BSIT', 'BSCS', 'BSBA', 'BSA', 'BSED'];
const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const SECTIONS = ['A', 'B', 'C', 'D', 'E'];
const STATUSES = ['Enrolled', 'Pending', 'Cancelled'];

const SELECT_CLASS =
  'h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 transition-colors hover:bg-slate-50 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20';

export default function EnrollmentFilters({ filters, onChange, onReset }: EnrollmentFiltersProps) {
  const update = (key: keyof FilterState, value: string) =>
    onChange({ ...filters, [key]: value });

  const hasActiveFilters =
    filters.search ||
    filters.academicYear ||
    filters.program ||
    filters.yearLevel ||
    filters.section ||
    filters.status;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3">
        {/* Search bar */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={filters.search}
            onChange={(e) => update('search', e.target.value)}
            placeholder="Search by student name or ID..."
            className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 transition-colors focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap gap-2">
          <select
            value={filters.academicYear}
            onChange={(e) => update('academicYear', e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">All Academic Years</option>
            {ACADEMIC_YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <select
            value={filters.program}
            onChange={(e) => update('program', e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">All Programs</option>
            {PROGRAMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <select
            value={filters.yearLevel}
            onChange={(e) => update('yearLevel', e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">All Year Levels</option>
            {YEAR_LEVELS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <select
            value={filters.section}
            onChange={(e) => update('section', e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">All Sections</option>
            {SECTIONS.map((s) => (
              <option key={s} value={s}>
                Section {s}
              </option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(e) => update('status', e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">All Status</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="md"
              onClick={onReset}
              icon={<X className="h-4 w-4" />}
            >
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}