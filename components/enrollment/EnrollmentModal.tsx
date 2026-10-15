'use client';

import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import type { EnrollmentRecord } from './EnrollmentData';
import { ENROLLMENT_STATUS_TONE } from './EnrollmentData';

type Mode = 'view' | 'edit' | 'add' | 'delete';

interface EnrollmentModalProps {
  open: boolean;
  mode: Mode;
  record?: EnrollmentRecord | null;
  onClose: () => void;
  onConfirm: () => void;
}

const PROGRAMS = ['BSIT', 'BSCS', 'BSBA', 'BSA', 'BSED'];
const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const SECTIONS = ['A', 'B', 'C', 'D', 'E'];
const ACADEMIC_YEARS = ['2025-2026', '2024-2025', '2023-2024'];
const STATUSES = ['Enrolled', 'Pending', 'Cancelled'];

const INPUT_CLASS =
  'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20';

const LABEL_CLASS = 'mb-1 block text-xs font-medium text-slate-600';

export default function EnrollmentModal({
  open,
  mode,
  record,
  onClose,
  onConfirm,
}: EnrollmentModalProps) {
  if (mode === 'delete') {
    return (
      <Modal
        open={open}
        onClose={onClose}
        title="Delete Enrollment Record"
        subtitle="This action cannot be undone."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="danger" onClick={onConfirm}>
              Delete Record
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Are you sure you want to delete the enrollment record for{' '}
          <span className="font-semibold text-slate-900">{record?.studentName}</span> (
          {record?.studentId})? This will remove the record from the system.
        </p>
      </Modal>
    );
  }

  if (mode === 'view' && record) {
    return (
      <Modal
        open={open}
        onClose={onClose}
        title="Enrollment Record Details"
        subtitle={`Record ID: ${record.id}`}
        footer={
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
              {record.studentName.split(' ').slice(0, 2).map((n) => n[0]).join('')}
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">{record.studentName}</p>
              <p className="text-xs text-slate-500">{record.email}</p>
            </div>
          </div>

          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <Detail label="Student ID" value={record.studentId} />
            <Detail label="Program" value={record.program} />
            <Detail label="Year Level" value={record.yearLevel} />
            <Detail label="Section" value={`Section ${record.section}`} />
            <Detail label="Academic Year" value={record.academicYear} />
            <Detail label="Date Enrolled" value={record.dateEnrolled} />
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Status
              </dt>
              <dd className="mt-1">
                <Badge tone={ENROLLMENT_STATUS_TONE[record.status]} dot>
                  {record.status}
                </Badge>
              </dd>
            </div>
          </dl>
        </div>
      </Modal>
    );
  }

  const isEdit = mode === 'edit';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Enrollment Record' : 'Add Enrollment Record'}
      subtitle={
        isEdit
          ? `Editing record ${record?.id}`
          : 'Fill in the student enrollment information below.'
      }
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>{isEdit ? 'Save Changes' : 'Add Record'}</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={LABEL_CLASS}>Student Name</label>
          <input
            type="text"
            defaultValue={record?.studentName ?? ''}
            placeholder="e.g., Andrea Santos"
            className={INPUT_CLASS}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={LABEL_CLASS}>Email Address</label>
          <input
            type="email"
            defaultValue={record?.email ?? ''}
            placeholder="student@school.edu"
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label className={LABEL_CLASS}>Student ID</label>
          <input
            type="text"
            defaultValue={record?.studentId ?? ''}
            placeholder="2025-00001"
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label className={LABEL_CLASS}>Academic Year</label>
          <select defaultValue={record?.academicYear ?? '2025-2026'} className={INPUT_CLASS}>
            {ACADEMIC_YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={LABEL_CLASS}>Program</label>
          <select defaultValue={record?.program ?? 'BSIT'} className={INPUT_CLASS}>
            {PROGRAMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={LABEL_CLASS}>Year Level</label>
          <select defaultValue={record?.yearLevel ?? '1st Year'} className={INPUT_CLASS}>
            {YEAR_LEVELS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={LABEL_CLASS}>Section</label>
          <select defaultValue={record?.section ?? 'A'} className={INPUT_CLASS}>
            {SECTIONS.map((s) => (
              <option key={s} value={s}>
                Section {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={LABEL_CLASS}>Enrollment Status</label>
          <select defaultValue={record?.status ?? 'Enrolled'} className={INPUT_CLASS}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className={LABEL_CLASS}>Date Enrolled</label>
          <input
            type="text"
            defaultValue={record?.dateEnrolled ?? ''}
            placeholder="e.g., Aug 15, 2025"
            className={INPUT_CLASS}
          />
        </div>
      </div>
    </Modal>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-slate-800">{value}</dd>
    </div>
  );
}