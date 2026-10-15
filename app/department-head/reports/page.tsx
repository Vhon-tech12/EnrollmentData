'use client';

import { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Printer,
  FileSpreadsheet,
  Sparkles,
  TrendingUp,
  Inbox,
  X,
  CheckCircle2,
  AlertCircle,
  Lock,
  Building2,
  Eye,
  BarChart3,
} from 'lucide-react';
import { useEnrollments, type EnrollmentRecord } from '@/lib/useEnrollments';
import { useCurrentDepartment } from '@/lib/useCurrentDepartment';
import {
  exportToExcel,
  printReport,
  generatePDFPreviewUrl,
  type ExportData,
} from '@/lib/export';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

type ReportType = 'comprehensive' | 'program' | 'year-level' | 'section' | 'trend';

const REPORT_TYPES: { value: ReportType; label: string; description: string }[] = [
  {
    value: 'comprehensive',
    label: 'Comprehensive Report',
    description: 'All analytics — trend, program, year level, section, status',
  },
  {
    value: 'program',
    label: 'Program Enrollment Report',
    description: 'Breakdown per program within your department',
  },
  {
    value: 'year-level',
    label: 'Year-Level Enrollment Report',
    description: 'Distribution across year levels',
  },
  {
    value: 'section',
    label: 'Section Enrollment Report',
    description: 'Section-level distribution',
  },
  {
    value: 'trend',
    label: 'Department Trend Report',
    description: 'Year-over-year trends with line chart',
  },
];

const ACADEMIC_YEARS = ['2025-2026', '2024-2025', '2023-2024', '2022-2023', '2021-2022'];
const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const SECTIONS = ['A', 'B', 'C', 'D', 'E'];

const SELECT_CLASS =
  'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 transition-colors hover:bg-slate-50 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200';

const LABEL_CLASS =
  'mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400';

interface FilterState {
  reportType: ReportType;
  academicYear: string;
  program: string;
  yearLevel: string;
}

const DEFAULT_FILTERS: FilterState = {
  reportType: 'comprehensive',
  academicYear: '',
  program: '',
  yearLevel: '',
};

export default function DepartmentReportsPage() {
  const { records, loading, error } = useEnrollments();
  const { department, loading: deptLoading } = useCurrentDepartment();
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [showPreview, setShowPreview] = useState(false);
  const [generatedAt, setGeneratedAt] = useState('');
  const [toast, setToast] = useState<{ msg: string; tone: 'success' | 'error' } | null>(null);
  const [exporting, setExporting] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!department) return [];
    return records.filter((r) => {
      if (!department.programs.includes(r.program)) return false;
      return (
        (!filters.academicYear || r.academicYear === filters.academicYear) &&
        (!filters.program || r.program === filters.program) &&
        (!filters.yearLevel || r.yearLevel === filters.yearLevel)
      );
    });
  }, [records, filters, department]);

  const currentReport = REPORT_TYPES.find((r) => r.value === filters.reportType);

  const update = <K extends keyof FilterState>(key: K, value: FilterState[K]) =>
    setFilters({ ...filters, [key]: value });

  const showToast = (msg: string, tone: 'success' | 'error' = 'success') => {
    setToast({ msg, tone });
    setTimeout(() => setToast(null), 3500);
  };

  const handleGenerate = () => {
    const now = new Date();
    setGeneratedAt(
      now.toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' }) +
        ' · ' +
        now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    );
    setShowPreview(true);
  };

  // ============ BUILD EXPORT DATA ============
  const buildExportData = (): ExportData => {
    if (!department) {
      return { title: 'Department Report', subtitle: '', summary: [], columns: [], rows: [] };
    }

    const total = filtered.length;
    const enrolled = filtered.filter((r) => r.status === 'Enrolled').length;
    const pending = filtered.filter((r) => r.status === 'Pending').length;
    const cancelled = filtered.filter((r) => r.status === 'Cancelled').length;

    const subtitle = [
      department.name,
      filters.academicYear ? `AY ${filters.academicYear}` : 'All Academic Years',
      filters.program || 'All Programs',
      filters.yearLevel || 'All Year Levels',
    ].join('  ·  ');

    const summary = [
      { label: 'Total Records', value: total },
      { label: 'Enrolled', value: enrolled },
      { label: 'Pending', value: pending },
      { label: 'Cancelled', value: cancelled },
    ];

    // ============ DATA FOR CHARTS ============
    const programData = department.programs.map((p) => {
      const rows = filtered.filter((r) => r.program === p);
      return {
        name: p,
        enrolled: rows.filter((r) => r.status === 'Enrolled').length,
        pending: rows.filter((r) => r.status === 'Pending').length,
        cancelled: rows.filter((r) => r.status === 'Cancelled').length,
        total: rows.length,
      };
    }).filter((d) => d.total > 0);

    const yearLevelData = YEAR_LEVELS.map((y) => {
      const rows = filtered.filter((r) => r.yearLevel === y);
      return {
        name: y,
        enrolled: rows.filter((r) => r.status === 'Enrolled').length,
        pending: rows.filter((r) => r.status === 'Pending').length,
        cancelled: rows.filter((r) => r.status === 'Cancelled').length,
        total: rows.length,
      };
    }).filter((d) => d.total > 0);

    const sectionData = SECTIONS.map((s) => {
      const rows = filtered.filter((r) => r.section === s);
      return {
        name: `Section ${s}`,
        enrolled: rows.filter((r) => r.status === 'Enrolled').length,
        pending: rows.filter((r) => r.status === 'Pending').length,
        cancelled: rows.filter((r) => r.status === 'Cancelled').length,
        total: rows.length,
      };
    }).filter((d) => d.total > 0);

    const trendData = [...ACADEMIC_YEARS].reverse().map((ay) => {
      const rows = records.filter((r) => {
        if (!department.programs.includes(r.program)) return false;
        if (filters.program && r.program !== filters.program) return false;
        if (filters.yearLevel && r.yearLevel !== filters.yearLevel) return false;
        return r.academicYear === ay;
      });
      return {
        name: ay,
        enrolled: rows.filter((r) => r.status === 'Enrolled').length,
        total: rows.length,
      };
    });

    // ============ CHART CONFIGS ============
    const trendChart = {
      type: 'line' as const,
      title: 'Enrollment Trend by Academic Year',
      data: trendData.map((d) => ({
        label: d.name,
        value: d.total,
        secondary: d.enrolled,
      })),
      series: [
        { name: 'Total Records', color: [37, 99, 235] as [number, number, number], key: 'value' as const },
        { name: 'Enrolled', color: [20, 184, 166] as [number, number, number], key: 'secondary' as const },
      ],
    };

    const programChart = {
      type: 'bar-horizontal' as const,
      title: 'Enrollment by Program',
      data: programData.map((d) => ({
        label: d.name,
        value: d.total,
        color: [37, 99, 235] as [number, number, number],
      })),
    };

    const yearLevelChart = {
      type: 'bar-vertical' as const,
      title: 'Enrollment by Year Level',
      data: yearLevelData.map((d) => ({
        label: d.name,
        value: d.total,
        color: [37, 99, 235] as [number, number, number],
      })),
    };

    const sectionChart = {
      type: 'bar-horizontal' as const,
      title: 'Enrollment by Section',
      data: sectionData.map((d) => ({
        label: d.name,
        value: d.total,
        color: [59, 130, 246] as [number, number, number],
      })),
    };

    const statusChart = {
      type: 'donut' as const,
      title: 'Enrollment Status Distribution',
      data: [
        { label: 'Enrolled', value: enrolled, color: [16, 185, 129] as [number, number, number] },
        { label: 'Pending', value: pending, color: [245, 158, 11] as [number, number, number] },
        { label: 'Cancelled', value: cancelled, color: [239, 68, 68] as [number, number, number] },
      ].filter((d) => d.value > 0),
    };

    const allCharts = [trendChart, programChart, yearLevelChart, sectionChart, statusChart];

    // ============ COMPREHENSIVE — ALL IN ONE ============
    if (filters.reportType === 'comprehensive') {
      // Combined table rows — all breakdowns stacked
      const rows: (string | number)[][] = [];

      // Header for Program section
      rows.push(['── BY PROGRAM ──', '', '', '', '']);

      programData.forEach((d) => {
        rows.push([d.name, d.enrolled, d.pending, d.cancelled, d.total]);
      });
      rows.push([
        'Program Subtotal',
        programData.reduce((s, d) => s + d.enrolled, 0),
        programData.reduce((s, d) => s + d.pending, 0),
        programData.reduce((s, d) => s + d.cancelled, 0),
        programData.reduce((s, d) => s + d.total, 0),
      ]);

      rows.push(['', '', '', '', '']);

      // Year Level
      rows.push(['── BY YEAR LEVEL ──', '', '', '', '']);
      yearLevelData.forEach((d) => {
        rows.push([d.name, d.enrolled, d.pending, d.cancelled, d.total]);
      });
      rows.push([
        'Year Level Subtotal',
        yearLevelData.reduce((s, d) => s + d.enrolled, 0),
        yearLevelData.reduce((s, d) => s + d.pending, 0),
        yearLevelData.reduce((s, d) => s + d.cancelled, 0),
        yearLevelData.reduce((s, d) => s + d.total, 0),
      ]);

      rows.push(['', '', '', '', '']);

      // Section
      rows.push(['── BY SECTION ──', '', '', '', '']);
      sectionData.forEach((d) => {
        rows.push([d.name, d.enrolled, d.pending, d.cancelled, d.total]);
      });
      rows.push([
        'Section Subtotal',
        sectionData.reduce((s, d) => s + d.enrolled, 0),
        sectionData.reduce((s, d) => s + d.pending, 0),
        sectionData.reduce((s, d) => s + d.cancelled, 0),
        sectionData.reduce((s, d) => s + d.total, 0),
      ]);

      rows.push(['', '', '', '', '']);

      // Status
      rows.push(['── BY STATUS ──', '', '', '', '']);
      rows.push(['Enrolled', enrolled, '', '', enrolled]);
      rows.push(['Pending', pending, '', '', pending]);
      rows.push(['Cancelled', cancelled, '', '', cancelled]);

      rows.push(['', '', '', '', '']);

      // Trend
      rows.push(['── BY ACADEMIC YEAR ──', '', '', '', '']);
      trendData.forEach((d, i, arr) => {
        const prev = i > 0 ? arr[i - 1].total : 0;
        const growth = prev > 0 ? ((d.total - prev) / prev) * 100 : 0;
        rows.push([
          d.name,
          d.enrolled,
          '',
          i === 0 ? '—' : `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`,
          d.total,
        ]);
      });

      return {
        title: 'Comprehensive Enrollment Report',
        subtitle,
        summary,
        columns: ['Category', 'Enrolled', 'Pending', 'Cancelled', 'Total'],
        rows,
        charts: allCharts,
      };
    }

    // ============ SPECIFIC REPORT TYPES (chart per type) ============
    if (filters.reportType === 'program') {
      return {
        title: 'Department Program Enrollment Report',
        subtitle,
        summary,
        columns: ['Program', 'Enrolled', 'Pending', 'Cancelled', 'Total'],
        rows: [
          ...programData.map((d) => [d.name, d.enrolled, d.pending, d.cancelled, d.total]),
          [
            'TOTAL',
            programData.reduce((s, d) => s + d.enrolled, 0),
            programData.reduce((s, d) => s + d.pending, 0),
            programData.reduce((s, d) => s + d.cancelled, 0),
            programData.reduce((s, d) => s + d.total, 0),
          ],
        ],
        charts: [programChart, statusChart],
      };
    }

    if (filters.reportType === 'year-level') {
      return {
        title: 'Department Year-Level Enrollment Report',
        subtitle,
        summary,
        columns: ['Year Level', 'Enrolled', 'Pending', 'Cancelled', 'Total'],
        rows: [
          ...yearLevelData.map((d) => [d.name, d.enrolled, d.pending, d.cancelled, d.total]),
          [
            'TOTAL',
            yearLevelData.reduce((s, d) => s + d.enrolled, 0),
            yearLevelData.reduce((s, d) => s + d.pending, 0),
            yearLevelData.reduce((s, d) => s + d.cancelled, 0),
            yearLevelData.reduce((s, d) => s + d.total, 0),
          ],
        ],
        charts: [yearLevelChart, statusChart],
      };
    }

    if (filters.reportType === 'section') {
      return {
        title: 'Department Section Enrollment Report',
        subtitle,
        summary,
        columns: ['Section', 'Enrolled', 'Pending', 'Cancelled', 'Total'],
        rows: [
          ...sectionData.map((d) => [d.name, d.enrolled, d.pending, d.cancelled, d.total]),
          [
            'TOTAL',
            sectionData.reduce((s, d) => s + d.enrolled, 0),
            sectionData.reduce((s, d) => s + d.pending, 0),
            sectionData.reduce((s, d) => s + d.cancelled, 0),
            sectionData.reduce((s, d) => s + d.total, 0),
          ],
        ],
        charts: [sectionChart, statusChart],
      };
    }

    // Trend report
    const rowsWithGrowth = trendData
      .filter((d) => d.total > 0)
      .map((d, i, arr) => {
        const prev = i > 0 ? arr[i - 1].total : 0;
        const growth = prev > 0 ? ((d.total - prev) / prev) * 100 : 0;
        return [
          d.name,
          d.enrolled,
          d.total,
          i === 0 ? '—' : `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`,
        ];
      });

    return {
      title: 'Department Enrollment Trend Report',
      subtitle,
      summary,
      columns: ['Academic Year', 'Enrolled', 'Total', 'Growth'],
      rows: rowsWithGrowth,
      charts: [trendChart],
    };
  };

  const handlePreviewPDF = async () => {
    if (filtered.length === 0) {
      showToast('Walang data na ma-preview. Adjust mo yung filters.', 'error');
      return;
    }
    setExporting(true);
    try {
      await new Promise((r) => setTimeout(r, 100));
      const data = buildExportData();
      const url = generatePDFPreviewUrl(data);
      setPdfPreviewUrl(url);
    } catch (e: any) {
      showToast('PDF preview failed: ' + (e?.message ?? 'Unknown error'), 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!pdfPreviewUrl) return;
    const data = buildExportData();
    const timestamp = new Date().toISOString().slice(0, 10);
    const safeName = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const filename = `${safeName}-${timestamp}.pdf`;

    const a = document.createElement('a');
    a.href = pdfPreviewUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    showToast('PDF downloaded successfully.');
    setTimeout(() => {
      URL.revokeObjectURL(pdfPreviewUrl);
      setPdfPreviewUrl(null);
    }, 500);
  };

  const handleExport = async (format: 'excel' | 'print') => {
    if (filtered.length === 0) {
      showToast('Walang data na ma-export.', 'error');
      return;
    }

    setExporting(true);
    try {
      await new Promise((r) => setTimeout(r, 100));
      const data = buildExportData();
      const timestamp = new Date().toISOString().slice(0, 10);
      const safeName = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const filename = `${safeName}-${timestamp}`;

      if (format === 'excel') {
        exportToExcel(data, `${filename}.xlsx`);
        showToast('Excel file downloaded successfully.');
      } else {
        printReport(data);
        showToast('Print dialog opened.');
      }
    } catch (e: any) {
      showToast('Export failed: ' + (e?.message ?? 'Unknown error'), 'error');
    } finally {
      setExporting(false);
    }
  };

  if (loading || deptLoading || !department) {
    return (
      <div className="space-y-6">
        <Card className="shadow-lg">
          <CardBody>
            <div className="flex items-center justify-center gap-3 py-16">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600 dark:border-blue-900 dark:border-t-blue-500" />
              <p className="text-sm text-slate-500 dark:text-slate-400">Loading department data…</p>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Header department={department} />
        <Card className="shadow-lg">
          <CardBody>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <p className="mt-3 text-sm font-medium text-slate-800 dark:text-slate-200">Failed to load reports</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{error}</p>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (department.programs.length === 0) {
    return (
      <div className="space-y-6">
        <Header department={department} />
        <Card className="shadow-lg">
          <CardBody>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <Building2 className="h-7 w-7 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">No programs assigned</h3>
              <p className="mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400">
                Your department has no programs assigned in the system yet. Contact the School Administrator.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (records.length === 0 || filtered.length === 0) {
    return (
      <div className="space-y-6">
        <Header department={department} />
        <Card className="shadow-lg">
          <CardBody>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <Inbox className="h-7 w-7 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
                Wala pang data to generate reports
              </h3>
              <p className="mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400">
                Enrollment data for {department.name} programs ({department.programs.join(', ')}) will appear here once imported by the Registrar.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header department={department} recordCount={filtered.length} />

      <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
            <Building2 className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-300">Department-scoped reports</p>
            <p className="mt-0.5 text-xs text-emerald-700 dark:text-emerald-400">
              Reports are filtered to <strong>{department.name}</strong> programs only: {department.programs.join(', ')}.
            </p>
          </div>
        </div>
      </div>

      {/* Config */}
      <Card className="shadow-lg">
        <CardHeader title="Report Configuration" subtitle="Select report type and filters, then generate the report." />
        <CardBody>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2 lg:col-span-4">
              <label className={LABEL_CLASS}>Report Type</label>
              <select
                value={filters.reportType}
                onChange={(e) => update('reportType', e.target.value as ReportType)}
                className={SELECT_CLASS}
              >
                {REPORT_TYPES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              {currentReport && (
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{currentReport.description}</p>
              )}
            </div>

            <div>
              <label className={LABEL_CLASS}>Academic Year</label>
              <select value={filters.academicYear} onChange={(e) => update('academicYear', e.target.value)} className={SELECT_CLASS}>
                <option value="">All Academic Years</option>
                {ACADEMIC_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div>
              <label className={LABEL_CLASS}>Program</label>
              <select value={filters.program} onChange={(e) => update('program', e.target.value)} className={SELECT_CLASS}>
                <option value="">All Department Programs</option>
                {department.programs.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div>
              <label className={LABEL_CLASS}>Year Level</label>
              <select value={filters.yearLevel} onChange={(e) => update('yearLevel', e.target.value)} className={SELECT_CLASS}>
                <option value="">All Year Levels</option>
                {YEAR_LEVELS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div className="flex items-end">
              <Button onClick={handleGenerate} icon={<Sparkles className="h-4 w-4" />} className="w-full">
                Generate Report
              </Button>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/40">
            <p className="text-xs text-blue-800 dark:text-blue-300">
              <span className="font-semibold">Note:</span> {filtered.length} record{filtered.length !== 1 ? 's' : ''} from {department.programs.join(', ')} match your filters.
            </p>
          </div>
        </CardBody>
      </Card>

      {/* Report type cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORT_TYPES.map((r) => {
          const isComprehensive = r.value === 'comprehensive';
          return (
            <button
              key={r.value}
              type="button"
              onClick={() => {
                setFilters({ ...filters, reportType: r.value });
                setTimeout(handleGenerate, 0);
              }}
              className={`group flex flex-col items-start gap-2 rounded-2xl border p-5 text-left shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg dark:bg-slate-900 ${
                isComprehensive
                  ? 'border-blue-300 bg-gradient-to-br from-blue-50 to-white dark:border-blue-800 dark:from-blue-950/40 dark:to-slate-900'
                  : 'border-slate-200 bg-white dark:border-slate-800'
              }`}
            >
              <div className="flex w-full items-start justify-between">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    isComprehensive
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                  }`}
                >
                  {isComprehensive ? <BarChart3 className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                </span>
                {isComprehensive && (
                  <span className="rounded-md bg-blue-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                    All-in-one
                  </span>
                )}
              </div>
              <h3 className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{r.label}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{r.description}</p>
            </button>
          );
        })}
      </div>

      {/* Report Preview Modal */}
      <Modal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        title={currentReport?.label ?? 'Department Report'}
        subtitle={`Generated on ${generatedAt}`}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => handleExport('print')} disabled={exporting} icon={<Printer className="h-4 w-4" />}>
              Print
            </Button>
            <Button variant="secondary" onClick={() => handleExport('excel')} disabled={exporting} icon={<FileSpreadsheet className="h-4 w-4" />}>
              Excel
            </Button>
            <Button onClick={handlePreviewPDF} disabled={exporting} icon={<Eye className="h-4 w-4" />}>
              {exporting ? 'Preparing…' : 'Preview PDF'}
            </Button>
          </>
        }
      >
        <ReportPreview
          reportType={filters.reportType}
          filters={filters}
          records={filtered}
          allRecords={records}
          generatedAt={generatedAt}
          department={department}
        />
      </Modal>

      {/* PDF Preview Modal */}
      {pdfPreviewUrl && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={() => { URL.revokeObjectURL(pdfPreviewUrl); setPdfPreviewUrl(null); }} />

          <div className="relative z-10 flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">PDF Preview</h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Review the report below, then download if it looks good.
                </p>
              </div>
              <button
                type="button"
                onClick={() => { URL.revokeObjectURL(pdfPreviewUrl); setPdfPreviewUrl(null); }}
                className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close preview"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 bg-slate-100 dark:bg-slate-950">
              <iframe
                src={pdfPreviewUrl}
                title="PDF Preview"
                className="h-full w-full border-0"
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3 dark:border-slate-800 dark:bg-slate-900">
              <Button
                variant="secondary"
                onClick={() => { URL.revokeObjectURL(pdfPreviewUrl); setPdfPreviewUrl(null); }}
              >
                Close
              </Button>
              <Button onClick={handleDownloadPDF} icon={<Download className="h-4 w-4" />}>
                Download PDF
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[100]">
          <div
            className={`flex items-center gap-3 rounded-xl border bg-white px-4 py-3 shadow-lg dark:bg-slate-900 ${
              toast.tone === 'success' ? 'border-emerald-200 dark:border-emerald-800' : 'border-red-200 dark:border-red-800'
            }`}
          >
            {toast.tone === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            )}
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{toast.msg}</p>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Header({
  department,
  recordCount,
}: {
  department: { name: string; shortName: string };
  recordCount?: number;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
          <FileText className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Department Reports</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {department.name} ·{' '}
            {recordCount !== undefined
              ? `${recordCount} record${recordCount !== 1 ? 's' : ''}`
              : 'Generate and export department reports'}
          </p>
        </div>
      </div>

      <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 dark:border-emerald-900 dark:bg-emerald-950/40">
        <Lock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
          {department.shortName}
        </span>
      </span>
    </div>
  );
}

function ReportPreview({
  reportType,
  filters,
  records,
  allRecords,
  generatedAt,
  department,
}: {
  reportType: ReportType;
  filters: FilterState;
  records: EnrollmentRecord[];
  allRecords: EnrollmentRecord[];
  generatedAt: string;
  department: { name: string; shortName: string; programs: string[] };
}) {
  const total = records.length;
  const enrolled = records.filter((r) => r.status === 'Enrolled').length;
  const pending = records.filter((r) => r.status === 'Pending').length;
  const cancelled = records.filter((r) => r.status === 'Cancelled').length;

  const filterSummary = [
    department.name,
    filters.academicYear ? `AY ${filters.academicYear}` : 'All Academic Years',
    filters.program || 'All Programs',
    filters.yearLevel || 'All Year Levels',
  ].join('  ·  ');

  const byProgram = department.programs
    .map((p) => {
      const rows = records.filter((r) => r.program === p);
      return {
        name: p,
        enrolled: rows.filter((r) => r.status === 'Enrolled').length,
        pending: rows.filter((r) => r.status === 'Pending').length,
        cancelled: rows.filter((r) => r.status === 'Cancelled').length,
        total: rows.length,
      };
    })
    .filter((d) => d.total > 0);

  const byYearLevel = YEAR_LEVELS.map((y) => {
    const rows = records.filter((r) => r.yearLevel === y);
    return {
      name: y,
      enrolled: rows.filter((r) => r.status === 'Enrolled').length,
      pending: rows.filter((r) => r.status === 'Pending').length,
      cancelled: rows.filter((r) => r.status === 'Cancelled').length,
      total: rows.length,
    };
  }).filter((d) => d.total > 0);

  const bySection = SECTIONS.map((s) => {
    const rows = records.filter((r) => r.section === s);
    return {
      name: `Section ${s}`,
      enrolled: rows.filter((r) => r.status === 'Enrolled').length,
      pending: rows.filter((r) => r.status === 'Pending').length,
      cancelled: rows.filter((r) => r.status === 'Cancelled').length,
      total: rows.length,
    };
  }).filter((d) => d.total > 0);

  const byAY = ACADEMIC_YEARS.map((ay) => {
    const rows = allRecords.filter((r) => {
      if (!department.programs.includes(r.program)) return false;
      if (filters.program && r.program !== filters.program) return false;
      if (filters.yearLevel && r.yearLevel !== filters.yearLevel) return false;
      return r.academicYear === ay;
    });
    return {
      name: ay,
      enrolled: rows.filter((r) => r.status === 'Enrolled').length,
      pending: rows.filter((r) => r.status === 'Pending').length,
      cancelled: rows.filter((r) => r.status === 'Cancelled').length,
      total: rows.length,
    };
  });

  const isComprehensive = reportType === 'comprehensive';

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-700 dark:bg-slate-800">
        <div className="flex justify-center">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Building2 className="h-5 w-5" />
          </span>
        </div>
        <h2 className="mt-2 text-sm font-bold uppercase tracking-wide text-slate-800 dark:text-slate-200">State University</h2>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          {department.name} ({department.shortName})
        </p>
        <p className="mt-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
          {REPORT_TYPES.find((r) => r.value === reportType)?.label}
        </p>
        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{filterSummary}</p>
        <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">Generated on {generatedAt}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MiniTile label="Total Records" value={total} tone="text-blue-700 dark:text-blue-400" />
        <MiniTile label="Enrolled" value={enrolled} tone="text-emerald-700 dark:text-emerald-400" />
        <MiniTile label="Pending" value={pending} tone="text-amber-700 dark:text-amber-400" />
        <MiniTile label="Cancelled" value={cancelled} tone="text-red-700 dark:text-red-400" />
      </div>

      {/* HTML preview of what's inside the PDF */}
      {isComprehensive ? (
        <div className="space-y-5">
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/40">
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
                <BarChart3 className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-semibold text-blue-900 dark:text-blue-300">
                  Comprehensive Report — All Visual Analytics Included
                </p>
                <p className="mt-0.5 text-xs text-blue-700 dark:text-blue-400">
                  This PDF contains <strong>5 charts</strong> (Trend, Program, Year Level, Section, Status) and a combined breakdown table.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <PreviewChartCard label="Trend" icon={<TrendingUp className="h-4 w-4" />} />
            <PreviewChartCard label="By Program" icon={<BarChart3 className="h-4 w-4" />} />
            <PreviewChartCard label="By Year Level" icon={<BarChart3 className="h-4 w-4" />} />
            <PreviewChartCard label="By Section" icon={<BarChart3 className="h-4 w-4" />} />
            <PreviewChartCard label="By Status" icon={<BarChart3 className="h-4 w-4" />} />
            <PreviewChartCard label="Detailed Table" icon={<FileText className="h-4 w-4" />} />
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
          {reportType === 'program' && <StandardTable data={byProgram} label="Program" />}
          {reportType === 'year-level' && <StandardTable data={byYearLevel} label="Year Level" />}
          {reportType === 'section' && <StandardTable data={bySection} label="Section" />}
          {reportType === 'trend' && <TrendTable data={byAY} />}
        </div>
      )}

      <p className="text-center text-[10px] italic text-slate-400 dark:text-slate-500">
        Click <strong>Preview PDF</strong> to see the actual PDF with charts, or <strong>Excel</strong> / <strong>Print</strong>.
      </p>
    </div>
  );
}

function PreviewChartCard({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-800">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
        {icon}
      </span>
      <span className="truncate text-xs font-medium text-slate-700 dark:text-slate-300">{label}</span>
    </div>
  );
}

function MiniTile({ label, value, tone }: { label: string; value: number | string; tone: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 text-center dark:border-slate-700 dark:bg-slate-800">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

function StandardTable({
  data,
  label,
}: {
  data: { name: string; enrolled: number; pending: number; cancelled: number; total: number }[];
  label: string;
}) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Inbox className="h-6 w-6 text-slate-400 dark:text-slate-500" />
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">No data for this report.</p>
      </div>
    );
  }

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
          <th className="px-4 py-2.5 font-semibold">{label}</th>
          <th className="px-4 py-2.5 text-right font-semibold">Enrolled</th>
          <th className="px-4 py-2.5 text-right font-semibold">Pending</th>
          <th className="px-4 py-2.5 text-right font-semibold">Cancelled</th>
          <th className="px-4 py-2.5 text-right font-semibold">Total</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
        {data.map((d) => (
          <tr key={d.name} className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
            <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200">{d.name}</td>
            <td className="px-4 py-2.5 text-right text-emerald-700 dark:text-emerald-400">{d.enrolled}</td>
            <td className="px-4 py-2.5 text-right text-amber-700 dark:text-amber-400">{d.pending}</td>
            <td className="px-4 py-2.5 text-right text-red-700 dark:text-red-400">{d.cancelled}</td>
            <td className="px-4 py-2.5 text-right font-semibold text-slate-900 dark:text-slate-100">{d.total}</td>
          </tr>
        ))}
        <tr className="border-t border-slate-200 bg-slate-50 font-semibold dark:border-slate-700 dark:bg-slate-800">
          <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">TOTAL</td>
          <td className="px-4 py-2.5 text-right text-emerald-700 dark:text-emerald-400">{data.reduce((s, d) => s + d.enrolled, 0)}</td>
          <td className="px-4 py-2.5 text-right text-amber-700 dark:text-amber-400">{data.reduce((s, d) => s + d.pending, 0)}</td>
          <td className="px-4 py-2.5 text-right text-red-700 dark:text-red-400">{data.reduce((s, d) => s + d.cancelled, 0)}</td>
          <td className="px-4 py-2.5 text-right text-slate-900 dark:text-slate-100">{data.reduce((s, d) => s + d.total, 0)}</td>
        </tr>
      </tbody>
    </table>
  );
}

function TrendTable({
  data,
}: {
  data: { name: string; enrolled: number; pending: number; cancelled: number; total: number }[];
}) {
  const nonEmpty = data.filter((d) => d.total > 0);

  if (nonEmpty.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Inbox className="h-6 w-6 text-slate-400 dark:text-slate-500" />
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">No trend data available.</p>
      </div>
    );
  }

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
          <th className="px-4 py-2.5 font-semibold">Academic Year</th>
          <th className="px-4 py-2.5 text-right font-semibold">Enrolled</th>
          <th className="px-4 py-2.5 text-right font-semibold">Total</th>
          <th className="px-4 py-2.5 text-right font-semibold">Growth</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
        {nonEmpty.map((d, i) => {
          const prev = i > 0 ? nonEmpty[i - 1].total : 0;
          const growth = prev > 0 ? ((d.total - prev) / prev) * 100 : 0;
          return (
            <tr key={d.name} className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
              <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200">{d.name}</td>
              <td className="px-4 py-2.5 text-right text-emerald-700 dark:text-emerald-400">{d.enrolled}</td>
              <td className="px-4 py-2.5 text-right font-semibold text-slate-900 dark:text-slate-100">{d.total}</td>
              <td className="px-4 py-2.5 text-right">
                {i === 0 ? (
                  <span className="text-xs text-slate-400">—</span>
                ) : (
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold ${
                      growth >= 0
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                        : 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400'
                    }`}
                  >
                    <TrendingUp className="h-3.5 w-3.5" />
                    {growth >= 0 ? '+' : ''}
                    {growth.toFixed(1)}%
                  </span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}