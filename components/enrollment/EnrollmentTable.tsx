'use client';

import { Eye, Pencil, Trash2 } from 'lucide-react';
import Badge, { type BadgeTone } from '@/components/ui/Badge';

export type EnrollmentStatus = 'Enrolled' | 'Pending' | 'Cancelled';

export interface EnrollmentRecord {
  id: string;
  studentId: string;
  studentName: string;
  email: string;
  program: string;
  yearLevel: string;
  section: string;
  academicYear: string;
  status: EnrollmentStatus;
  dateEnrolled: string;
}

export const ENROLLMENT_STATUS_TONE: Record<EnrollmentStatus, BadgeTone> = {
  Enrolled: 'success',
  Pending: 'warning',
  Cancelled: 'danger',
};

interface EnrollmentTableProps {
  records: EnrollmentRecord[];
  onView: (record: EnrollmentRecord) => void;
  onEdit: (record: EnrollmentRecord) => void;
  onDelete: (record: EnrollmentRecord) => void;
}

export default function EnrollmentTable({
  records,
  onView,
  onEdit,
  onDelete,
}: EnrollmentTableProps) {
  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
          <Eye className="h-6 w-6 text-slate-400" />
        </div>
        <h3 className="mt-4 text-sm font-semibold text-slate-900">No enrollment records found</h3>
        <p className="mt-1 text-xs text-slate-500">
          Try adjusting your filters or search keyword.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1000px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-500">
            <th className="px-5 py-3 font-semibold">Student ID</th>
            <th className="px-5 py-3 font-semibold">Student Name</th>
            <th className="px-5 py-3 font-semibold">Program</th>
            <th className="px-5 py-3 font-semibold">Year Level</th>
            <th className="px-5 py-3 font-semibold">Section</th>
            <th className="px-5 py-3 font-semibold">Academic Year</th>
            <th className="px-5 py-3 font-semibold">Status</th>
            <th className="px-5 py-3 font-semibold">Date Enrolled</th>
            <th className="px-5 py-3 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {records.map((record) => (
            <tr key={record.id} className="transition-colors hover:bg-slate-50/70">
              <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-slate-600">
                {record.studentId}
              </td>
              <td className="whitespace-nowrap px-5 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-semibold text-blue-700">
                    {record.studentName
                      .split(' ')
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join('')}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-800">{record.studentName}</p>
                    <p className="truncate text-[11px] text-slate-500">{record.email}</p>
                  </div>
                </div>
              </td>
              <td className="whitespace-nowrap px-5 py-3">
                <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                  {record.program}
                </span>
              </td>
              <td className="whitespace-nowrap px-5 py-3 text-slate-700">{record.yearLevel}</td>
              <td className="whitespace-nowrap px-5 py-3 text-slate-700">Section {record.section}</td>
              <td className="whitespace-nowrap px-5 py-3 text-slate-600">{record.academicYear}</td>
              <td className="whitespace-nowrap px-5 py-3">
                <Badge tone={ENROLLMENT_STATUS_TONE[record.status]} dot>
                  {record.status}
                </Badge>
              </td>
              <td className="whitespace-nowrap px-5 py-3 text-slate-500">{record.dateEnrolled}</td>
              <td className="whitespace-nowrap px-5 py-3">
                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => onView(record)}
                    title="View"
                    className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-600"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(record)}
                    title="Edit"
                    className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-amber-50 hover:text-amber-600"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(record)}
                    title="Delete"
                    className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}