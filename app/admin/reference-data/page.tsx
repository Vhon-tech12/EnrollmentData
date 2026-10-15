'use client';

import { useState, useMemo } from 'react';
import {
  Database,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  GraduationCap,
  Layers,
  Grid3x3,
  CheckCircle2,
  X,
  RefreshCw,
  AlertCircle,
  Inbox,
} from 'lucide-react';
import {
  useReferenceData,
  SEED_REFERENCE_DATA,
  type ReferenceItem,
  type ReferenceType,
} from '@/lib/useReferenceData';
import { logActivity } from '@/lib/logActivity';
import { useRole } from '@/components/RoleProvider';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';

const TABS: { key: ReferenceType; label: string; icon: typeof Database }[] = [
  { key: 'academic-years', label: 'Academic Years', icon: Calendar },
  { key: 'programs', label: 'Programs', icon: GraduationCap },
  { key: 'year-levels', label: 'Year Levels', icon: Layers },
  { key: 'sections', label: 'Sections', icon: Grid3x3 },
  { key: 'statuses', label: 'Statuses', icon: CheckCircle2 },
];

// 🛠️ NEW: Configuration for placeholders based on active tab
const TYPE_CONFIG: Record<
  ReferenceType,
  {
    singularLabel: string;
    codePlaceholder: string;
    labelPlaceholder: string;
    codeHelp?: string;
    labelHelp?: string;
  }
> = {
  'academic-years': {
    singularLabel: 'Academic Year',
    codePlaceholder: 'e.g., 2024-2025',
    labelPlaceholder: 'e.g., Academic Year 2024-2025',
  },
  programs: {
    singularLabel: 'Program',
    codePlaceholder: 'e.g., BSIT',
    labelPlaceholder: 'e.g., BS Information Technology',
  },
  'year-levels': {
    singularLabel: 'Year Level',
    codePlaceholder: 'e.g., 1',
    labelPlaceholder: 'e.g., First Year',
    codeHelp: 'Numeric code (e.g., 1, 2, 3, 4)',
  },
  sections: {
    singularLabel: 'Section',
    codePlaceholder: 'e.g., A',
    labelPlaceholder: 'e.g., Section A',
  },
  statuses: {
    singularLabel: 'Status',
    codePlaceholder: 'e.g., REG',
    labelPlaceholder: 'e.g., Regular',
  },
};

const INPUT_CLASS =
  'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-blue-500 dark:focus:ring-blue-500/20';

const LABEL_CLASS = 'mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400';

type ModalState =
  | { mode: 'add'; type: ReferenceType }
  | { mode: 'edit'; type: ReferenceType; item: ReferenceItem }
  | { mode: 'delete'; type: ReferenceType; item: ReferenceItem }
  | null;

export default function ReferenceDataPage() {
  const { user } = useRole();
  const { items, loading, error, refetch, seed, addItem, updateItem, deleteItem } =
    useReferenceData();
  const [activeTab, setActiveTab] = useState<ReferenceType>('academic-years');
  const [modal, setModal] = useState<ModalState>(null);
  const [seeding, setSeeding] = useState(false);
  const [toast, setToast] = useState<{ msg: string; tone: 'success' | 'error' } | null>(
    null,
  );

  const showToast = (msg: string, tone: 'success' | 'error' = 'success') => {
    setToast({ msg, tone });
    setTimeout(() => setToast(null), 3500);
  };

  const filteredItems = useMemo(
    () => items.filter((i) => i.type === activeTab),
    [items, activeTab],
  );

  const counts = useMemo(() => {
    const c: Record<ReferenceType, number> = {
      'academic-years': 0,
      programs: 0,
      'year-levels': 0,
      sections: 0,
      statuses: 0,
    };
    items.forEach((i) => {
      c[i.type] = (c[i.type] || 0) + 1;
    });
    return c;
  }, [items]);

  // Extract unique existing departments from the programs data
  const existingDepartments = useMemo(() => {
    const depts = items
      .filter((i) => i.type === 'programs' && i.description)
      .map((i) => i.description as string);
    return Array.from(new Set(depts)).sort();
  }, [items]);

  const handleSeed = async () => {
    if (!confirm('Seed demo reference data to Firestore?')) return;
    setSeeding(true);
    try {
      await seed();
      await logActivity({
        user: user.name,
        role: user.roleLabel,
        activity: 'Seeded reference data (22 items)',
        module: 'Reference Data',
      });
      showToast('Reference data seeded successfully.');
    } catch (e: any) {
      showToast('Seed failed: ' + (e?.message ?? 'Unknown error'), 'error');
    } finally {
      setSeeding(false);
    }
  };

  const handleDelete = async () => {
    if (!modal || modal.mode !== 'delete') return;
    try {
      await deleteItem(modal.item.id);
      await logActivity({
        user: user.name,
        role: user.roleLabel,
        activity: `Deleted ${modal.type} item: ${modal.item.code}`,
        module: 'Reference Data',
      });
      showToast('Item deleted successfully.');
      setModal(null);
    } catch (e: any) {
      showToast('Failed to delete: ' + (e?.message ?? 'Unknown error'), 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:border dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400">
            <Database className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Reference Data</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage the master lists used throughout the system.
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
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setModal({ mode: 'add', type: activeTab })}
          >
            Add {TYPE_CONFIG[activeTab].singularLabel}
          </Button>
        </div>
      </div>

      {/* Info banner */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-500/30 dark:bg-blue-500/10">
        <p className="text-xs text-blue-800 dark:text-blue-300/80">
          <span className="font-semibold dark:text-blue-200">Note:</span> Reference data is used by
          other modules — Enrollment, Analytics, and Reports. Changes made here
          affect the dropdowns and filters across the entire system. All changes
          are logged for audit purposes.
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <Card className="shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <CardBody>
            <div className="flex items-center justify-center gap-3 py-12">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600 dark:border-blue-900 dark:border-t-blue-500" />
              <p className="text-sm text-slate-500 dark:text-slate-400">Loading reference data…</p>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Error */}
      {error && !loading && (
        <Card className="shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <CardBody>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-8 w-8 text-red-500 dark:text-red-400" />
              <p className="mt-3 text-sm font-medium text-slate-800 dark:text-slate-200">
                Failed to load reference data
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{error}</p>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Empty state */}
      {!loading && !error && items.length === 0 && (
        <Card className="shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <CardBody>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <Inbox className="h-7 w-7 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
                Firestore is empty
              </h3>
              <p className="mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400">
                Wala pang reference data. I-seed mo muna yung default values (22
                items: academic years, programs, year levels, sections, statuses).
              </p>
              <div className="mt-5">
                <Button
                  onClick={handleSeed}
                  disabled={seeding}
                  icon={<Database className="h-4 w-4" />}
                >
                  {seeding ? 'Seeding…' : 'Seed Default Reference Data'}
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Content */}
      {!loading && !error && items.length > 0 && (
        <>
          {/* Tabs */}
          <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap gap-1">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                      active
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 ${active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}
                    />
                    {tab.label}
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                        active
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500'
                      }`}
                    >
                      {counts[tab.key]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Table */}
          <Card className="shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <CardHeader
              title={TABS.find((t) => t.key === activeTab)?.label ?? ''}
              subtitle={`Manage ${filteredItems.length} item${filteredItems.length !== 1 ? 's' : ''}`}
            />
            <CardBody className="px-0 py-0">
              {filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    No items in this category yet.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                        <th className="px-5 py-3 font-semibold">Code</th>
                        <th className="px-5 py-3 font-semibold">Label</th>
                        {(activeTab === 'programs' || activeTab === 'year-levels') && (
                          <th className="px-5 py-3 font-semibold">
                            {activeTab === 'programs' ? 'Department' : 'Order'}
                          </th>
                        )}
                        {activeTab === 'academic-years' && (
                          <th className="px-5 py-3 font-semibold">Current</th>
                        )}
                        <th className="px-5 py-3 font-semibold">Status</th>
                        <th className="px-5 py-3 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredItems.map((item) => (
                        <tr
                          key={item.id}
                          className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/50"
                        >
                          <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                            {item.code}
                          </td>
                          <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-200">
                            {item.label}
                          </td>
                          {(activeTab === 'programs' ||
                            activeTab === 'year-levels') && (
                            <td className="px-5 py-3 text-slate-600 dark:text-slate-400">
                              {activeTab === 'programs'
                                ? item.description ?? '—'
                                : `#${item.order ?? '—'}`}
                            </td>
                          )}
                          {activeTab === 'academic-years' && (
                            <td className="px-5 py-3">
                              {item.isCurrent ? (
                                <Badge tone="brand" dot>
                                  Current
                                </Badge>
                              ) : (
                                <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                              )}
                            </td>
                          )}
                          <td className="px-5 py-3">
                            <Badge
                              tone={item.status === 'Active' ? 'success' : 'neutral'}
                              dot
                            >
                              {item.status}
                            </Badge>
                          </td>
                          <td className="whitespace-nowrap px-5 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  setModal({ mode: 'edit', type: activeTab, item })
                                }
                                title="Edit"
                                className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-amber-50 hover:text-amber-600 dark:text-slate-400 dark:hover:bg-amber-500/10 dark:hover:text-amber-400"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setModal({ mode: 'delete', type: activeTab, item })
                                }
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
              )}
            </CardBody>
          </Card>
        </>
      )}

      {/* Modal */}
      <ReferenceModal
        state={modal}
        onClose={() => setModal(null)}
        onSave={async (item) => {
          try {
            if (modal?.mode === 'edit') {
              await updateItem(modal.item.id, item);
              await logActivity({
                user: user.name,
                role: user.roleLabel,
                activity: `Updated ${modal.type} item: ${item.code}`,
                module: 'Reference Data',
              });
              showToast('Item updated successfully.');
            } else {
              await addItem(item);
              await logActivity({
                user: user.name,
                role: user.roleLabel,
                activity: `Added ${modal?.type} item: ${item.code}`,
                module: 'Reference Data',
              });
              showToast('Item added successfully.');
            }
            setModal(null);
          } catch (e: any) {
            showToast('Failed: ' + (e?.message ?? 'Unknown error'), 'error');
          }
        }}
        onDelete={handleDelete}
        existingDepartments={existingDepartments}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[70]">
          <div
            className={`flex items-center gap-3 rounded-xl border bg-white px-4 py-3 shadow-lg dark:bg-slate-900 ${
              toast.tone === 'success' 
                ? 'border-emerald-200 dark:border-emerald-500/30' 
                : 'border-red-200 dark:border-red-500/30'
            }`}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full ${
                toast.tone === 'success'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
              }`}
            >
              {toast.tone === 'success' ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5" />
              )}
            </span>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{toast.msg}</p>
            <button
              type="button"
              onClick={() => setToast(null)}
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

// ============ REFERENCE MODAL ============
function ReferenceModal({
  state,
  onClose,
  onSave,
  onDelete,
  existingDepartments,
}: {
  state: ModalState;
  onClose: () => void;
  onSave: (item: Omit<ReferenceItem, 'id'>) => Promise<void>;
  onDelete: () => void;
  existingDepartments: string[];
}) {
  if (!state) return null;

  // Delete confirmation
  if (state.mode === 'delete') {
    return (
      <Modal
        open
        onClose={onClose}
        title="Delete Item"
        subtitle="This action cannot be undone."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="danger" onClick={onDelete}>
              Delete
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400">
            <Trash2 className="h-5 w-5" />
          </span>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {state.item.code}
            </span>{' '}
            ({state.item.label})?
          </p>
        </div>
      </Modal>
    );
  }

  const isEdit = state.mode === 'edit';
  const item = isEdit ? state.item : null;
  const type = state.type;

  const handleSubmit = (form: Omit<ReferenceItem, 'id'>) => {
    onSave(form);
  };

  return (
    <ReferenceFormModal
      isEdit={isEdit}
      type={type}
      item={item}
      onClose={onClose}
      onSubmit={handleSubmit}
      existingDepartments={existingDepartments}
    />
  );
}

// ============ REFERENCE FORM ============
function ReferenceFormModal({
  isEdit,
  type,
  item,
  onClose,
  onSubmit,
  existingDepartments,
}: {
  isEdit: boolean;
  type: ReferenceType;
  item: ReferenceItem | null;
  onClose: () => void;
  onSubmit: (form: Omit<ReferenceItem, 'id'>) => void;
  existingDepartments: string[];
}) {
  const config = TYPE_CONFIG[type]; // 🛠️ Get config based on type
  const [form, setForm] = useState<Omit<ReferenceItem, 'id'>>({
    type,
    code: item?.code ?? '',
    label: item?.label ?? '',
    description: item?.description ?? '',
    order: item?.order,
    isCurrent: item?.isCurrent ?? false,
    status: item?.status ?? 'Active',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.code.trim() || !form.label.trim()) {
      alert('Code and Label are required.');
      return;
    }
    setSaving(true);

    // Sanitize the payload to avoid Firestore 'undefined' errors
    const payload: Omit<ReferenceItem, 'id'> = {
      type: form.type,
      code: form.code.trim(),
      label: form.label.trim(),
      status: form.status,
      isCurrent: form.isCurrent ?? false,
    };

    // Only add optional fields if they have valid values
    if (form.description && form.description.trim() !== '') {
      payload.description = form.description.trim();
    }
    
    if (form.order !== undefined && !isNaN(form.order)) {
      payload.order = form.order;
    }

    await onSubmit(payload);
    setSaving(false);
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? `Edit ${config.singularLabel}` : `Add New ${config.singularLabel}`}
      subtitle={
        isEdit
          ? `Update the information for this ${config.singularLabel.toLowerCase()}.`
          : `Fill in the information to add a new ${config.singularLabel.toLowerCase()}.`
      }
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : `Add ${config.singularLabel}`}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* 🛠️ DYNAMIC: Code label + placeholder based on active tab */}
        <div>
          <label className={LABEL_CLASS}>{config.singularLabel} Code *</label>
          <input
            type="text"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder={config.codePlaceholder}
            className={INPUT_CLASS}
          />
          {config.codeHelp && (
            <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
              {config.codeHelp}
            </p>
          )}
        </div>

        {/* 🛠️ DYNAMIC: Label label + placeholder based on active tab */}
        <div>
          <label className={LABEL_CLASS}>{config.singularLabel} Label *</label>
          <input
            type="text"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            placeholder={config.labelPlaceholder}
            className={INPUT_CLASS}
          />
          {config.labelHelp && (
            <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
              {config.labelHelp}
            </p>
          )}
        </div>

        {type === 'programs' && (
          <div>
            <label className={LABEL_CLASS}>Department</label>
            <input
              list="departments-list"
              value={form.description ?? ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="e.g., College of Computer Studies"
              className={INPUT_CLASS}
            />
            <datalist id="departments-list">
              {existingDepartments.map((dept) => (
                <option key={dept} value={dept} />
              ))}
            </datalist>
            <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
              Type a new department or select from existing ones.
            </p>
          </div>
        )}

        {type === 'year-levels' && (
          <div>
            <label className={LABEL_CLASS}>Order</label>
            <input
              type="number"
              value={form.order ?? ''}
              onChange={(e) =>
                setForm({ ...form, order: e.target.value ? Number(e.target.value) : undefined })
              }
              placeholder="e.g., 5"
              className={INPUT_CLASS}
            />
            <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
              Numeric order for sorting (1 = first year, 2 = second year, etc.)
            </p>
          </div>
        )}

        {type === 'academic-years' && (
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={form.isCurrent ?? false}
              onChange={(e) => setForm({ ...form, isCurrent: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:checked:bg-blue-500"
            />
            Mark as current academic year
          </label>
        )}

        <div>
          <label className={LABEL_CLASS}>Status</label>
          <select
            value={form.status}
            onChange={(e) =>
              setForm({ ...form, status: e.target.value as 'Active' | 'Inactive' })
            }
            className={INPUT_CLASS}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>
    </Modal>
  );
}