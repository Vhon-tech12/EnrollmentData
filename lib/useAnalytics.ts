'use client';

import { useMemo } from 'react';
import type { EnrollmentRecord } from './useEnrollments';

export const PROGRAMS = ['BSIT', 'BSCS', 'BSBA', 'BSA', 'BSED'];
export const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
export const SECTIONS = ['A', 'B', 'C', 'D', 'E'];
export const ACADEMIC_YEARS = [
  '2025-2026',
  '2024-2025',
  '2023-2024',
  '2022-2023',
  '2021-2022',
];

export const PROGRAM_COLORS: Record<string, string> = {
  BSIT: 'bg-blue-600',
  BSCS: 'bg-sky-500',
  BSBA: 'bg-indigo-500',
  BSA: 'bg-violet-500',
  BSED: 'bg-teal-500',
};

interface UseAnalyticsOptions {
  /** Filter records to a specific set of programs (for department-scoped views) */
  programFilter?: string[];
  /** Additional filter for academic year */
  academicYear?: string;
  /** Additional filter for program */
  program?: string;
  /** Additional filter for year level */
  yearLevel?: string;
  /** Additional filter for section */
  section?: string;
}

export function useAnalytics(
  allRecords: EnrollmentRecord[],
  options: UseAnalyticsOptions = {},
) {
  return useMemo(() => {
    const { programFilter, academicYear, program, yearLevel, section } = options;

    // 1. Filter records
    const filtered = allRecords.filter((r) => {
      // Program filter (for department head)
      if (programFilter && !programFilter.includes(r.program)) return false;

      // User-applied filters
      if (academicYear && r.academicYear !== academicYear) return false;
      if (program && r.program !== program) return false;
      if (yearLevel && r.yearLevel !== yearLevel) return false;
      if (section && r.section !== section) return false;

      return true;
    });

    // 2. Basic counts
    const total = filtered.length;
    const enrolled = filtered.filter((r) => r.status === 'Enrolled').length;
    const pending = filtered.filter((r) => r.status === 'Pending').length;
    const cancelled = filtered.filter((r) => r.status === 'Cancelled').length;
    const enrollmentRate = total > 0 ? (enrolled / total) * 100 : 0;

    // 3. By Program
    const programsToUse = programFilter ?? PROGRAMS;
    const byProgram = programsToUse
      .map((p) => ({
        label: p,
        value: filtered.filter((r) => r.program === p).length,
        enrolled: filtered.filter(
          (r) => r.program === p && r.status === 'Enrolled',
        ).length,
        color: PROGRAM_COLORS[p] ?? 'bg-blue-600',
      }))
      .filter((d) => d.value > 0);

    // 4. By Year Level
    const byYearLevel = YEAR_LEVELS.map((y) => ({
      label: y,
      value: filtered.filter((r) => r.yearLevel === y).length,
    }));

    // 5. By Section
    const bySection = SECTIONS.map((s) => ({
      label: `Section ${s}`,
      value: filtered.filter((r) => r.section === s).length,
    })).filter((d) => d.value > 0);

    // 6. By Status
    const byStatus = [
      { label: 'Enrolled', value: enrolled, color: '#2563eb' },
      { label: 'Pending', value: pending, color: '#f59e0b' },
      { label: 'Cancelled', value: cancelled, color: '#ef4444' },
    ].filter((d) => d.value > 0);

    // 7. Trend by Academic Year (uses ALL records so trend is meaningful)
    const trend = ACADEMIC_YEARS.map((ay) => {
      const rows = allRecords.filter((r) => {
        if (programFilter && !programFilter.includes(r.program)) return false;
        return r.academicYear === ay;
      });
      return {
        year: ay,
        enrolled: rows.filter((r) => r.status === 'Enrolled').length,
        total: rows.length,
      };
    }).filter((d) => d.total > 0);

    // 8. Top program
    const sortedPrograms = [...byProgram].sort((a, b) => b.value - a.value);
    const topProgram = sortedPrograms[0];

    return {
      filtered,
      total,
      enrolled,
      pending,
      cancelled,
      enrollmentRate,
      byProgram,
      byYearLevel,
      bySection,
      byStatus,
      trend,
      topProgram,
    };
  }, [allRecords, options]);
}