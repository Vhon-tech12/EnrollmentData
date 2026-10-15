'use client';

import { useState, useMemo, useEffect, useRef, type ChangeEvent, type DragEvent } from 'react';
import {
  Plus,
  Users,
  Upload,
  FileSpreadsheet,
  Download,
  X,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Pencil,
  Eye,
  Search,
  Database,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useEnrollments, type EnrollmentRecord } from '@/lib/useEnrollments';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge, { type BadgeTone } from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';

type EnrollmentStatus = 'Enrolled' | 'Pending' | 'Cancelled';

const STATUS_TONE: Record<EnrollmentStatus, BadgeTone> = {
  Enrolled: 'success',
  Pending: 'warning',
  Cancelled: 'danger',
};

const ACADEMIC_YEARS = ['2025-2026', '2024-2025', '2023-2024', '2022-2023', '2021-2022'];
const PROGRAMS = ['BSIT', 'BSCS', 'BSBA', 'BSA', 'BSED'];
const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const SECTIONS = ['A', 'B', 'C', 'D', 'E'];
const STATUSES: EnrollmentStatus[] = ['Enrolled', 'Pending', 'Cancelled'];
const PAGE_SIZE_OPTIONS = [10, 15, 25, 50, 100];

// 🛠️ Dark mode enabled
const SELECT_CLASS =
  'h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 transition-colors hover:bg-slate-50 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:focus:border-blue-500 dark:focus:ring-blue-500/20';

const INPUT_CLASS =
  'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-500/20';

const LABEL_CLASS =
  'mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400';

interface FilterState {
  search: string;
  academicYear: string;
  program: string;
  yearLevel: string;
  section: string;
  status: string;
}

const EMPTY_FILTERS: FilterState = {
  search: '',
  academicYear: '',
  program: '',
  yearLevel: '',
  section: '',
  status: '',
};

type ModalMode = 'view' | 'edit' | 'add' | 'delete' | null;

// ============ SEED DATA ============
const SEED_DATA: Omit<EnrollmentRecord, 'id'>[] = [
  { studentId: '2025-00001', studentName: 'Andrea Santos', email: 'andrea.santos@student.edu', program: 'BSIT', yearLevel: '1st Year', section: 'A', academicYear: '2025-2026', status: 'Enrolled', dateEnrolled: 'Aug 15, 2025' },
  { studentId: '2025-00002', studentName: 'Miguel Reyes', email: 'miguel.reyes@student.edu', program: 'BSCS', yearLevel: '2nd Year', section: 'B', academicYear: '2025-2026', status: 'Pending', dateEnrolled: 'Aug 12, 2025' },
  { studentId: '2025-00003', studentName: 'Sofia Cruz', email: 'sofia.cruz@student.edu', program: 'BSBA', yearLevel: '3rd Year', section: 'A', academicYear: '2025-2026', status: 'Enrolled', dateEnrolled: 'Aug 10, 2025' },
  { studentId: '2025-00004', studentName: 'Rafael Bautista', email: 'rafael.bautista@student.edu', program: 'BSIT', yearLevel: '4th Year', section: 'C', academicYear: '2025-2026', status: 'Enrolled', dateEnrolled: 'Aug 08, 2025' },
  { studentId: '2025-00005', studentName: 'Isabella Ocampo', email: 'isabella.ocampo@student.edu', program: 'BSA', yearLevel: '1st Year', section: 'B', academicYear: '2025-2026', status: 'Cancelled', dateEnrolled: 'Aug 05, 2025' },
  { studentId: '2025-00006', studentName: 'Gabriel Garcia', email: 'gabriel.garcia@student.edu', program: 'BSED', yearLevel: '2nd Year', section: 'A', academicYear: '2025-2026', status: 'Enrolled', dateEnrolled: 'Aug 04, 2025' },
  { studentId: '2025-00007', studentName: 'Camila Mendoza', email: 'camila.mendoza@student.edu', program: 'BSCS', yearLevel: '3rd Year', section: 'D', academicYear: '2025-2026', status: 'Enrolled', dateEnrolled: 'Aug 03, 2025' },
  { studentId: '2025-00008', studentName: 'Joshua Torres', email: 'joshua.torres@student.edu', program: 'BSIT', yearLevel: '1st Year', section: 'A', academicYear: '2025-2026', status: 'Pending', dateEnrolled: 'Aug 02, 2025' },
  { studentId: '2025-00009', studentName: 'Patricia Villanueva', email: 'patricia.villanueva@student.edu', program: 'BSBA', yearLevel: '4th Year', section: 'B', academicYear: '2025-2026', status: 'Enrolled', dateEnrolled: 'Aug 01, 2025' },
  { studentId: '2025-00010', studentName: 'Nathaniel Aquino', email: 'nathaniel.aquino@student.edu', program: 'BSA', yearLevel: '2nd Year', section: 'C', academicYear: '2025-2026', status: 'Enrolled', dateEnrolled: 'Jul 30, 2025' },
  { studentId: '2025-00011', studentName: 'Bianca Castillo', email: 'bianca.castillo@student.edu', program: 'BSED', yearLevel: '3rd Year', section: 'A', academicYear: '2025-2026', status: 'Cancelled', dateEnrolled: 'Jul 28, 2025' },
  { studentId: '2025-00012', studentName: 'Christian Del Rosario', email: 'christian.delrosario@student.edu', program: 'BSIT', yearLevel: '1st Year', section: 'D', academicYear: '2025-2026', status: 'Enrolled', dateEnrolled: 'Jul 27, 2025' },
  { studentId: '2025-00013', studentName: 'Danica Ramos', email: 'danica.ramos@student.edu', program: 'BSCS', yearLevel: '4th Year', section: 'B', academicYear: '2025-2026', status: 'Enrolled', dateEnrolled: 'Jul 25, 2025' },
  { studentId: '2025-00014', studentName: 'Emmanuel Navarro', email: 'emmanuel.navarro@student.edu', program: 'BSBA', yearLevel: '2nd Year', section: 'A', academicYear: '2025-2026', status: 'Pending', dateEnrolled: 'Jul 22, 2025' },
  { studentId: '2025-00015', studentName: 'Faith Salazar', email: 'faith.salazar@student.edu', program: 'BSED', yearLevel: '1st Year', section: 'C', academicYear: '2025-2026', status: 'Enrolled', dateEnrolled: 'Jul 20, 2025' },
];

export default function RegistrarEnrollmentPage() {
  const { records, loading, error, refetch } = useEnrollments();
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedRecord, setSelectedRecord] = useState<EnrollmentRecord | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [toast, setToast] = useState('');
  const [seeding, setSeeding] = useState(false);

  // ============ PAGINATION STATE ============
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const update = (key: keyof FilterState, value: string) =>
    setFilters({ ...filters, [key]: value });

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const q = filters.search.toLowerCase();
      const matchesSearch =
        !q ||
        r.studentName.toLowerCase().includes(q) ||
        r.studentId.toLowerCase().includes(q);

      return (
        matchesSearch &&
        (!filters.academicYear || r.academicYear === filters.academicYear) &&
        (!filters.program || r.program === filters.program) &&
        (!filters.yearLevel || r.yearLevel === filters.yearLevel) &&
        (!filters.section || r.section === filters.section) &&
        (!filters.status || r.status === filters.status)
      );
    });
  }, [records, filters]);

  // ============ PAGINATION LOGIC ============
  const totalFiltered = filteredRecords.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalFiltered);
  const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

  const hasActiveFilters = Boolean(
    filters.search ||
      filters.academicYear ||
      filters.program ||
      filters.yearLevel ||
      filters.section ||
      filters.status,
  );

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  // ============ SEED ============
  const handleSeedData = async () => {
    if (!confirm('Add 15 sample enrollment records to Firestore?')) return;
    setSeeding(true);
    try {
      const batch = writeBatch(db);
      const col = collection(db, 'enrollments');
      SEED_DATA.forEach((record) => {
        const newDocRef = doc(col);
        batch.set(newDocRef, record);
      });
      await batch.commit();
      await refetch();
      showToast('15 sample records added to Firestore.');
    } catch (e: any) {
      showToast('Seed failed: ' + (e?.message ?? 'Unknown error'));
    } finally {
      setSeeding(false);
    }
  };

  // ============ ADD ============
  const handleAdd = async (data: Omit<EnrollmentRecord, 'id'>) => {
    try {
      await addDoc(collection(db, 'enrollments'), data);
      await refetch();
      showToast('Enrollment record added successfully.');
      setModalMode(null);
    } catch (e: any) {
      showToast('Failed to add record: ' + (e?.message ?? 'Unknown error'));
    }
  };

  // ============ UPDATE ============
  const handleUpdate = async (id: string, data: Partial<EnrollmentRecord>) => {
    try {
      const { id: _ignore, ...rest } = data as any;
      await updateDoc(doc(db, 'enrollments', id), rest);
      await refetch();
      showToast('Enrollment record updated successfully.');
      setModalMode(null);
    } catch (e: any) {
      showToast('Failed to update record: ' + (e?.message ?? 'Unknown error'));
    }
  };

  // ============ DELETE ============
  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'enrollments', id));
      await refetch();
      showToast('Enrollment record deleted successfully.');
      setModalMode(null);
    } catch (e: any) {
      showToast('Failed to delete record: ' + (e?.message ?? 'Unknown error'));
    }
  };

  // ============ IMPORT ============
  const handleImport = async (imported: Omit<EnrollmentRecord, 'id'>[]) => {
    try {
      const batch = writeBatch(db);
      const col = collection(db, 'enrollments');
      imported.forEach((record) => {
        const newDocRef = doc(col);
        batch.set(newDocRef, record);
      });
      await batch.commit();
      await refetch();
      setShowImport(false);
      showToast(`${imported.length} enrollment records imported successfully.`);
    } catch (e: any) {
      showToast('Import failed: ' + (e?.message ?? 'Unknown error'));
    }
  };

  const stats = {
    total: records.length,
    enrolled: records.filter((r) => r.status === 'Enrolled').length,
    pending: records.filter((r) => r.status === 'Pending').length,
    cancelled: records.filter((r) => r.status === 'Cancelled').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:border dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400">
            <Users className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Enrollment Management
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage, organize, and import student enrollment records.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={refetch}
            disabled={loading}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Button
            variant="secondary"
            icon={<Upload className="h-4 w-4" />}
            onClick={() => setShowImport(true)}
          >
            Import File
          </Button>
          <Button
            icon={<Plus className="h-4 w-4" />}
            onClick={() => {
              setSelectedRecord(null);
              setModalMode('add');
            }}
          >
            Add Enrollment
          </Button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <Card className="dark:border-slate-800 dark:bg-slate-900">
          <CardBody>
            <div className="flex items-center justify-center gap-3 py-12">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600 dark:border-blue-900 dark:border-t-blue-500" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Loading from Firestore…
              </p>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Error */}
      {error && !loading && (
        <Card className="dark:border-slate-800 dark:bg-slate-900">
          <CardBody>
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400">
                <AlertCircle className="h-6 w-6" />
              </span>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                Failed to load records
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{error}</p>
              <button
                type="button"
                onClick={refetch}
                className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
              >
                Try Again
              </button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Empty state */}
      {!loading && !error && records.length === 0 && (
        <Card className="dark:border-slate-800 dark:bg-slate-900">
          <CardBody>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                <Database className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
                Firestore is empty
              </h3>
              <p className="mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400">
                Wala pang enrollment records. Pwede kang mag-seed ng demo data o
                mag-import ng Excel file.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <Button
                  onClick={handleSeedData}
                  disabled={seeding}
                  icon={<Database className="h-4 w-4" />}
                >
                  {seeding ? 'Seeding…' : 'Seed Demo Data (15 records)'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowImport(true)}
                  icon={<Upload className="h-4 w-4" />}
                >
                  Import Excel
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Main content */}
      {!loading && !error && records.length > 0 && (
        <>
          {/* Stat tiles */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile label="Total Records" value={stats.total} />
            <StatTile
              label="Enrolled"
              value={stats.enrolled}
              tone="text-emerald-600 dark:text-emerald-400"
            />
            <StatTile
              label="Pending"
              value={stats.pending}
              tone="text-amber-600 dark:text-amber-400"
            />
            <StatTile
              label="Cancelled"
              value={stats.cancelled}
              tone="text-red-600 dark:text-red-400"
            />
          </div>

          {/* Filters */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  type="search"
                  value={filters.search}
                  onChange={(e) => update('search', e.target.value)}
                  placeholder="Search by student name or ID..."
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 transition-colors focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:bg-slate-900 dark:focus:ring-blue-500/20"
                />
              </div>

              <div className="flex flex-wrap gap-2">
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

                <select
                  value={filters.status}
                  onChange={(e) => update('status', e.target.value)}
                  className={SELECT_CLASS}
                >
                  <option value="">All Status</option>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={() => setFilters(EMPTY_FILTERS)}
                    className="h-10 rounded-lg px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Table */}
          <Card className="shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <CardHeader
              title="Enrollment Records"
              subtitle={
                totalFiltered > 0
                  ? `Showing ${startIndex + 1}–${endIndex} of ${totalFiltered} record${totalFiltered !== 1 ? 's' : ''}`
                  : 'No records match your filters'
              }
              action={
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Rows per page:
                  </span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 transition-colors hover:bg-slate-50 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
                  >
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
              }
            />
            <CardBody className="px-0 py-0">
              {totalFiltered === 0 ? (
                <EmptyState />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1000px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
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
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {paginatedRecords.map((record) => (
                          <tr
                            key={record.id}
                            className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/50"
                          >
                            <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                              {record.studentId}
                            </td>
                            <td className="whitespace-nowrap px-5 py-3">
                              <div className="flex items-center gap-2.5">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-semibold text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
                                  {record.studentName.split(' ').slice(0, 2).map((p) => p[0]).join('')}
                                </span>
                                <div className="min-w-0">
                                  <p className="truncate font-medium text-slate-800 dark:text-slate-200">
                                    {record.studentName}
                                  </p>
                                  <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                                    {record.email}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-5 py-3">
                              <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                {record.program}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-5 py-3 text-slate-700 dark:text-slate-300">
                              {record.yearLevel}
                            </td>
                            <td className="whitespace-nowrap px-5 py-3 text-slate-700 dark:text-slate-300">
                              Section {record.section}
                            </td>
                            <td className="whitespace-nowrap px-5 py-3 text-slate-600 dark:text-slate-400">
                              {record.academicYear}
                            </td>
                            <td className="whitespace-nowrap px-5 py-3">
                              <Badge tone={STATUS_TONE[record.status]} dot>
                                {record.status}
                              </Badge>
                            </td>
                            <td className="whitespace-nowrap px-5 py-3 text-slate-500 dark:text-slate-400">
                              {record.dateEnrolled}
                            </td>
                            <td className="whitespace-nowrap px-5 py-3">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => { setSelectedRecord(record); setModalMode('view'); }}
                                  title="View"
                                  className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-blue-500/10 dark:hover:text-blue-400"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setSelectedRecord(record); setModalMode('edit'); }}
                                  title="Edit"
                                  className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-amber-50 hover:text-amber-600 dark:text-slate-400 dark:hover:bg-amber-500/10 dark:hover:text-amber-400"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setSelectedRecord(record); setModalMode('delete'); }}
                                  title="Delete"
                                  className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-400"
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

                  {/* ============ PAGINATION CONTROLS ============ */}
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalRecords={totalFiltered}
                    startIndex={startIndex}
                    endIndex={endIndex}
                    onPageChange={setCurrentPage}
                  />
                </>
              )}
            </CardBody>
          </Card>
        </>
      )}

      {/* Import modal */}
      <ImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
        onImport={handleImport}
        existingIds={records.map((r) => r.studentId)}
      />

      {/* Record modal */}
      <RecordModal
        open={modalMode !== null}
        mode={modalMode}
        record={selectedRecord}
        onClose={() => { setModalMode(null); setSelectedRecord(null); }}
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[70]">
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3 shadow-lg dark:border-emerald-500/30 dark:bg-slate-900">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
              {toast}
            </p>
            <button
              type="button"
              onClick={() => setToast('')}
              className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ PAGINATION COMPONENT ============
function Pagination({
  currentPage,
  totalPages,
  totalRecords,
  startIndex,
  endIndex,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
}) {
  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    pages.push(1);

    let start = Math.max(2, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages - 1, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(2, end - maxVisible + 1);
    }

    if (start > 2) pages.push('...');

    for (let i = start; i <= end; i++) pages.push(i);

    if (end < totalPages - 1) pages.push('...');

    pages.push(totalPages);

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 dark:border-slate-800">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Showing{' '}
        <span className="font-semibold text-slate-700 dark:text-slate-300">
          {startIndex + 1}
        </span>
        –
        <span className="font-semibold text-slate-700 dark:text-slate-300">
          {endIndex}
        </span>{' '}
        of{' '}
        <span className="font-semibold text-slate-700 dark:text-slate-300">
          {totalRecords}
        </span>{' '}
        record{totalRecords !== 1 ? 's' : ''}
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          aria-label="First page"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200 dark:disabled:hover:bg-slate-800"
        >
          <ChevronsLeft className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200 dark:disabled:hover:bg-slate-800"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>

        {pageNumbers.map((page, idx) => {
          if (page === '...') {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="flex h-8 w-8 items-center justify-center text-xs text-slate-400 dark:text-slate-500"
              >
                …
              </span>
            );
          }
          const pageNum = page as number;
          const active = pageNum === currentPage;
          return (
            <button
              key={pageNum}
              type="button"
              onClick={() => onPageChange(pageNum)}
              className={`flex h-8 min-w-[32px] items-center justify-center rounded-lg border text-xs font-medium transition-colors ${
                active
                  ? 'border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white'
              }`}
            >
              {pageNum}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200 dark:disabled:hover:bg-slate-800"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="Last page"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200 dark:disabled:hover:bg-slate-800"
        >
          <ChevronsRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ============ IMPORT MODAL ============
function ImportModal({
  open,
  onClose,
  onImport,
  existingIds,
}: {
  open: boolean;
  onClose: () => void;
  onImport: (records: Omit<EnrollmentRecord, 'id'>[]) => void;
  existingIds: string[];
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Omit<EnrollmentRecord, 'id'>[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [parsing, setParsing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setFile(null);
      setPreview([]);
      setErrors([]);
      setDragOver(false);
    }
  }, [open]);

  const handleFile = async (selectedFile: File) => {
    setParsing(true);
    setFile(selectedFile);
    setPreview([]);
    setErrors([]);

    try {
      const XLSX = await import('xlsx');
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

      if (rows.length === 0) {
        setErrors(['The file is empty. Please upload a file with data.']);
        setParsing(false);
        return;
      }

      const parsed: Omit<EnrollmentRecord, 'id'>[] = [];
      const errorList: string[] = [];

      rows.forEach((row, index) => {
        const rowNumber = index + 2;
        const studentId = String(row['Student ID'] ?? row['studentId'] ?? '').trim();
        const studentName = String(row['Student Name'] ?? row['studentName'] ?? '').trim();
        const email = String(row['Email'] ?? row['email'] ?? '').trim();
        const program = String(row['Program'] ?? row['program'] ?? '').trim();
        const yearLevel = String(row['Year Level'] ?? row['yearLevel'] ?? '').trim();
        const section = String(row['Section'] ?? row['section'] ?? '').trim();
        const academicYear = String(row['Academic Year'] ?? row['academicYear'] ?? '').trim();
        const status = String(row['Status'] ?? row['status'] ?? 'Pending').trim();
        const dateEnrolled = String(row['Date Enrolled'] ?? row['dateEnrolled'] ?? '').trim();

        if (!studentId || !studentName) {
          errorList.push(`Row ${rowNumber}: Missing Student ID or Name.`);
          return;
        }
        if (existingIds.includes(studentId)) {
          errorList.push(`Row ${rowNumber}: Student ID "${studentId}" already exists (skipped).`);
          return;
        }
        if (program && !PROGRAMS.includes(program)) {
          errorList.push(`Row ${rowNumber}: Unknown program "${program}".`);
        }

        const normalizedStatus: EnrollmentStatus =
          status === 'Enrolled' || status === 'Cancelled' ? status : 'Pending';

        parsed.push({
          studentId,
          studentName,
          email: email || `${studentName.toLowerCase().replace(/\s+/g, '.')}@student.edu`,
          program: program || 'BSIT',
          yearLevel: yearLevel || '1st Year',
          section: section || 'A',
          academicYear: academicYear || '2025-2026',
          status: normalizedStatus,
          dateEnrolled:
            dateEnrolled ||
            new Date().toLocaleDateString('en-US', {
              month: 'short',
              day: '2-digit',
              year: 'numeric',
            }),
        });
      });

      setPreview(parsed);
      setErrors(errorList);
    } catch {
      setErrors(['Failed to read the file. Please use a valid XLSX or CSV file.']);
    } finally {
      setParsing(false);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const downloadTemplate = async () => {
    const XLSX = await import('xlsx');
    const template = [
      {
        'Student ID': '2025-00001',
        'Student Name': 'Juan Dela Cruz',
        Email: 'juan.delacruz@student.edu',
        Program: 'BSIT',
        'Year Level': '1st Year',
        Section: 'A',
        'Academic Year': '2025-2026',
        Status: 'Enrolled',
        'Date Enrolled': 'Aug 15, 2025',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'enrollment-template.xlsx');
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Import Enrollment Records"
      subtitle="Upload an Excel or CSV file to bulk-add enrollment records."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => onImport(preview)}
            disabled={preview.length === 0}
            icon={<Upload className="h-4 w-4" />}
          >
            Import {preview.length > 0 ? `${preview.length} Records` : 'Records'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {!file && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
              dragOver
                ? 'border-blue-400 bg-blue-50 dark:border-blue-500 dark:bg-blue-500/10'
                : 'border-slate-300 bg-slate-50 hover:border-blue-300 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-blue-500/50'
            }`}
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
              <Upload className="h-6 w-6" />
            </span>
            <p className="mt-4 text-sm font-semibold text-slate-800 dark:text-slate-200">
              Drop your file here, or click to browse
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Supported: <span className="font-medium dark:text-slate-300">.xlsx, .xls, .csv</span>
            </p>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleInputChange}
              className="hidden"
            />
          </div>
        )}

        {file && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                <FileSpreadsheet className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                  {file.name}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {(file.size / 1024).toFixed(1)} KB ·{' '}
                  {parsing ? 'Parsing...' : `${preview.length} valid rows`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setFile(null); setPreview([]); setErrors([]); }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {errors.length > 0 && (
              <div className="max-h-32 overflow-y-auto rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/30 dark:bg-amber-500/10">
                <p className="mb-1.5 text-xs font-semibold text-amber-900 dark:text-amber-200">
                  {errors.length} warning{errors.length !== 1 ? 's' : ''}
                </p>
                <ul className="space-y-1 text-[11px] text-amber-800 dark:text-amber-300/80">
                  {errors.map((err, i) => <li key={i}>• {err}</li>)}
                </ul>
              </div>
            )}

            {preview.length > 0 && (
              <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                      <tr className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        <th className="px-3 py-2 font-semibold">Student ID</th>
                        <th className="px-3 py-2 font-semibold">Name</th>
                        <th className="px-3 py-2 font-semibold">Program</th>
                        <th className="px-3 py-2 font-semibold">Year</th>
                        <th className="px-3 py-2 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {preview.slice(0, 5).map((r, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 font-mono text-slate-600 dark:text-slate-400">
                            {r.studentId}
                          </td>
                          <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-200">
                            {r.studentName}
                          </td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                            {r.program}
                          </td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                            {r.yearLevel}
                          </td>
                          <td className="px-3 py-2">
                            <Badge tone={STATUS_TONE[r.status]} dot>
                              {r.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 🛠️ FIXED: Download Template section - now has dark mode */}
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 dark:border-blue-500/30 dark:bg-blue-500/10">
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
              <Download className="h-4 w-4" />
            </span>
            <div className="flex-1">
              <p className="text-xs font-semibold text-blue-900 dark:text-blue-200">
                Download template
              </p>
              <p className="mt-0.5 text-[11px] text-blue-700 dark:text-blue-300/80">
                Get the correct column headers and sample data.
              </p>
              <button
                type="button"
                onClick={downloadTemplate}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-medium text-blue-700 shadow-sm hover:bg-blue-100 dark:bg-blue-500/20 dark:text-blue-300 dark:hover:bg-blue-500/30"
              >
                <Download className="h-3 w-3" />
                Download Template (.xlsx)
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ============ RECORD MODAL ============
function RecordModal({
  open,
  mode,
  record,
  onClose,
  onAdd,
  onUpdate,
  onDelete,
}: {
  open: boolean;
  mode: ModalMode;
  record: EnrollmentRecord | null;
  onClose: () => void;
  onAdd: (data: Omit<EnrollmentRecord, 'id'>) => void;
  onUpdate: (id: string, data: Partial<EnrollmentRecord>) => void;
  onDelete: (id: string) => void;
}) {
  const [form, setForm] = useState<Omit<EnrollmentRecord, 'id'>>({
    studentId: '',
    studentName: '',
    email: '',
    program: 'BSIT',
    yearLevel: '1st Year',
    section: 'A',
    academicYear: '2025-2026',
    status: 'Pending',
    dateEnrolled: '',
  });

  useEffect(() => {
    if (record) {
      const { id, ...rest } = record;
      setForm(rest);
    } else {
      setForm({
        studentId: '',
        studentName: '',
        email: '',
        program: 'BSIT',
        yearLevel: '1st Year',
        section: 'A',
        academicYear: '2025-2026',
        status: 'Pending',
        dateEnrolled: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric',
        }),
      });
    }
  }, [record, open]);

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
            <Button variant="danger" onClick={() => record && onDelete(record.id)}>
              Delete Record
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Are you sure you want to delete the enrollment record for{' '}
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {record?.studentName}
          </span>{' '}
          ({record?.studentId})?
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
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <Detail label="Student ID" value={record.studentId} />
          <Detail label="Student Name" value={record.studentName} />
          <Detail label="Email" value={record.email} />
          <Detail label="Program" value={record.program} />
          <Detail label="Year Level" value={record.yearLevel} />
          <Detail label="Section" value={`Section ${record.section}`} />
          <Detail label="Academic Year" value={record.academicYear} />
          <Detail label="Date Enrolled" value={record.dateEnrolled} />
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Status
            </dt>
            <dd className="mt-1">
              <Badge tone={STATUS_TONE[record.status]} dot>
                {record.status}
              </Badge>
            </dd>
          </div>
        </dl>
      </Modal>
    );
  }

  const isEdit = mode === 'edit';

  const handleSubmit = () => {
    if (!form.studentName.trim() || !form.studentId.trim()) {
      alert('Student Name and Student ID are required.');
      return;
    }
    if (isEdit && record) {
      onUpdate(record.id, form);
    } else {
      onAdd(form);
    }
  };

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
          <Button onClick={handleSubmit}>
            {isEdit ? 'Save Changes' : 'Add Record'}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={LABEL_CLASS}>Student Name *</label>
          <input
            type="text"
            value={form.studentName}
            onChange={(e) => setForm({ ...form, studentName: e.target.value })}
            placeholder="e.g., Andrea Santos"
            className={INPUT_CLASS}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={LABEL_CLASS}>Email Address</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="student@school.edu"
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label className={LABEL_CLASS}>Student ID *</label>
          <input
            type="text"
            value={form.studentId}
            onChange={(e) => setForm({ ...form, studentId: e.target.value })}
            placeholder="2025-00001"
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label className={LABEL_CLASS}>Academic Year</label>
          <select
            value={form.academicYear}
            onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
            className={INPUT_CLASS}
          >
            {ACADEMIC_YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={LABEL_CLASS}>Program</label>
          <select
            value={form.program}
            onChange={(e) => setForm({ ...form, program: e.target.value })}
            className={INPUT_CLASS}
          >
            {PROGRAMS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={LABEL_CLASS}>Year Level</label>
          <select
            value={form.yearLevel}
            onChange={(e) => setForm({ ...form, yearLevel: e.target.value })}
            className={INPUT_CLASS}
          >
            {YEAR_LEVELS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={LABEL_CLASS}>Section</label>
          <select
            value={form.section}
            onChange={(e) => setForm({ ...form, section: e.target.value })}
            className={INPUT_CLASS}
          >
            {SECTIONS.map((s) => (
              <option key={s} value={s}>Section {s}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={LABEL_CLASS}>Enrollment Status</label>
          <select
            value={form.status}
            onChange={(e) =>
              setForm({ ...form, status: e.target.value as EnrollmentStatus })
            }
            className={INPUT_CLASS}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className={LABEL_CLASS}>Date Enrolled</label>
          <input
            type="text"
            value={form.dateEnrolled}
            onChange={(e) => setForm({ ...form, dateEnrolled: e.target.value })}
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
      <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-200">
        {value}
      </dd>
    </div>
  );
}

function StatTile({
  label,
  value,
  tone = 'text-slate-900 dark:text-slate-100',
}: {
  label: string;
  value: number;
  tone?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
        <Users className="h-6 w-6 text-slate-400 dark:text-slate-500" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
        No matching records
      </h3>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Try adjusting your filters.
      </p>
    </div>
  );
}