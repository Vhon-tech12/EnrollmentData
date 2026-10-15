'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  UserSquare2,
  Plus,
  Search,
  Pencil,
  Trash2,
  Mail,
  ShieldCheck,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Lock,
  Users as UsersIcon,
} from 'lucide-react';
import {
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  useUsers,
  ROLE_LABELS,
  type AppUser,
  type UserRole,
  type UserStatus,
} from '@/lib/useUsers';
import { useReferenceData } from '@/lib/useReferenceData';
import { createAppUser, getInitials } from '@/lib/createUser';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge, { type BadgeTone } from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';

const ROLE_TONE: Record<UserRole, BadgeTone> = {
  admin: 'brand',
  registrar: 'info',
  'department-head': 'success',
};

const STATUS_TONE: Record<UserStatus, BadgeTone> = {
  Active: 'success',
  Inactive: 'neutral',
  Suspended: 'danger',
};

const INPUT_CLASS =
  'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-blue-500 dark:focus:ring-blue-500/20 dark:disabled:bg-slate-800/50 dark:disabled:text-slate-500';

const LABEL_CLASS = 'mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400';

const SELECT_CLASS =
  'h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 transition-colors hover:bg-slate-50 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:focus:border-blue-500 dark:focus:ring-blue-500/20';

interface FilterState {
  search: string;
  role: string;
  status: string;
}

const EMPTY_FILTERS: FilterState = {
  search: '',
  role: '',
  status: '',
};

type ModalMode = 'add' | 'edit' | 'delete' | null;

export default function AdminUsersPage() {
  const { users, loading, error, refetch } = useUsers();
  const { items: referenceItems } = useReferenceData();
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [toast, setToast] = useState<{ msg: string; tone: 'success' | 'error' } | null>(
    null,
  );

  // 🛠️ NEW: Extract unique departments from reference data (programs)
  const departments = useMemo(() => {
    const depts = referenceItems
      .filter((i) => i.type === 'programs' && i.description)
      .map((i) => i.description as string);
    return Array.from(new Set(depts)).sort();
  }, [referenceItems]);

  const showToast = (msg: string, tone: 'success' | 'error' = 'success') => {
    setToast({ msg, tone });
    setTimeout(() => setToast(null), 4000);
  };

  const update = (key: keyof FilterState, value: string) =>
    setFilters({ ...filters, [key]: value });

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = filters.search.toLowerCase();
      const matchesSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q);
      return (
        matchesSearch &&
        (!filters.role || u.role === filters.role) &&
        (!filters.status || u.status === filters.status)
      );
    });
  }, [users, filters]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      admins: users.filter((u) => u.role === 'admin').length,
      registrars: users.filter((u) => u.role === 'registrar').length,
      deptHeads: users.filter((u) => u.role === 'department-head').length,
    };
  }, [users]);

  const openModal = (mode: ModalMode, user?: AppUser) => {
    setSelectedUser(user ?? null);
    setModalMode(mode);
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedUser(null);
  };

  const hasActiveFilters = Boolean(
    filters.search || filters.role || filters.status,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:border dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400">
            <UserSquare2 className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">User Management</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Create and manage accounts for Registrars and Department Heads.
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
            onClick={() => openModal('add')}
          >
            Add User
          </Button>
        </div>
      </div>

      {/* Info banner */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-500/30 dark:bg-blue-500/10">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
            <Lock className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-semibold text-blue-900 dark:text-blue-200">
              Admin-only account creation
            </p>
            <p className="mt-0.5 text-xs text-blue-700 dark:text-blue-300/80">
              Ikaw lang (School Administrator) ang makakagawa ng bagong account
              para sa Registrar at Department Head. Ang mga user na 'to ay
              pwedeng mag-login gamit ang email at password na itatakda mo.
            </p>
          </div>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Total Users" value={stats.total} />
        <StatTile
          label="Administrators"
          value={stats.admins}
          tone="text-blue-600 dark:text-blue-400"
        />
        <StatTile
          label="Registrars"
          value={stats.registrars}
          tone="text-sky-600 dark:text-sky-400"
        />
        <StatTile
          label="Department Heads"
          value={stats.deptHeads}
          tone="text-emerald-600 dark:text-emerald-400"
        />
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="search"
              value={filters.search}
              onChange={(e) => update('search', e.target.value)}
              placeholder="Search by name or email..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 transition-colors focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:bg-slate-900 dark:focus:ring-blue-500/20"
            />
          </div>

          <select
            value={filters.role}
            onChange={(e) => update('role', e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">All Roles</option>
            <option value="admin">School Administrator</option>
            <option value="registrar">Registrar</option>
            <option value="department-head">Department Head</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => update('status', e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Suspended">Suspended</option>
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

      {/* Table */}
      <Card className="shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <CardHeader
          title="System Users"
          subtitle={
            loading
              ? 'Loading…'
              : `Showing ${filteredUsers.length} of ${users.length} user${users.length !== 1 ? 's' : ''}`
          }
        />
        <CardBody className="px-0 py-0">
          {loading && (
            <div className="flex items-center justify-center gap-3 py-16">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600 dark:border-blue-900 dark:border-t-blue-500" />
              <p className="text-sm text-slate-500 dark:text-slate-400">Loading users…</p>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <AlertCircle className="h-8 w-8 text-red-500 dark:text-red-400" />
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Failed to load users</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{error}</p>
            </div>
          )}

          {!loading && !error && filteredUsers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <UsersIcon className="h-6 w-6 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
                No users found
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {users.length === 0
                  ? 'Click "Add User" para gumawa ng bagong account.'
                  : 'Try adjusting your filters.'}
              </p>
            </div>
          )}

          {!loading && !error && filteredUsers.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                    <th className="px-5 py-3 font-semibold">Name</th>
                    <th className="px-5 py-3 font-semibold">Email</th>
                    <th className="px-5 py-3 font-semibold">Role</th>
                    <th className="px-5 py-3 font-semibold">Department</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Created</th>
                    <th className="px-5 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/50"
                    >
                      <td className="whitespace-nowrap px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
                            {user.initials || getInitials(user.name)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-800 dark:text-slate-200">
                              {user.name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                          {user.email}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3">
                        <Badge tone={ROLE_TONE[user.role]}>
                          {ROLE_LABELS[user.role]}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-xs text-slate-600 dark:text-slate-400">
                        {user.department}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3">
                        <Badge tone={STATUS_TONE[user.status]} dot>
                          {user.status}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-xs text-slate-500 dark:text-slate-400">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: '2-digit',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openModal('edit', user)}
                            title="Edit"
                            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-amber-50 hover:text-amber-600 dark:text-slate-400 dark:hover:bg-amber-500/10 dark:hover:text-amber-400"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openModal('delete', user)}
                            disabled={user.role === 'admin'}
                            title={
                              user.role === 'admin'
                                ? 'Cannot delete administrator account'
                                : 'Delete'
                            }
                            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-400 dark:disabled:hover:bg-transparent dark:disabled:hover:text-slate-500"
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

      {/* Modal */}
      <UserModal
        open={modalMode !== null}
        mode={modalMode}
        user={selectedUser}
        existingEmails={users.map((u) => u.email.toLowerCase())}
        departments={departments}
        onClose={closeModal}
        onSuccess={async (msg) => {
          await refetch();
          closeModal();
          showToast(msg);
        }}
        onError={(msg) => showToast(msg, 'error')}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[80]">
          <div
            className={`flex items-center gap-3 rounded-xl border bg-white px-4 py-3 shadow-lg dark:bg-slate-900 ${
              toast.tone === 'success' 
                ? 'border-emerald-200 dark:border-emerald-500/30' 
                : 'border-red-200 dark:border-red-500/30'
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

// ============ USER MODAL ============
function UserModal({
  open,
  mode,
  user,
  existingEmails,
  departments,
  onClose,
  onSuccess,
  onError,
}: {
  open: boolean;
  mode: ModalMode;
  user: AppUser | null;
  existingEmails: string[];
  departments: string[];
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'registrar' as UserRole,
    department: departments[0] ?? '',
    status: 'Active' as UserStatus,
  });
  const [saving, setSaving] = useState(false);

  // Reset form when modal opens / user changes
  useEffect(() => {
    if (open) {
      if (user) {
        setForm({
          name: user.name,
          email: user.email,
          password: '',
          role: user.role,
          department: user.department,
          status: user.status,
        });
      } else {
        setForm({
          name: '',
          email: '',
          password: '',
          role: 'registrar',
          department: departments[0] ?? '',
          status: 'Active',
        });
      }
    }
  }, [open, user, departments]);

  // Handle Add
  const handleAdd = async () => {
    if (!form.name.trim()) {
      onError('Name is required.');
      return;
    }
    if (!form.email.trim()) {
      onError('Email is required.');
      return;
    }
    if (form.password.length < 6) {
      onError('Password must be at least 6 characters.');
      return;
    }
    if (!form.department.trim()) {
      onError('Please select a department. Add programs in Reference Data first.');
      return;
    }
    if (existingEmails.includes(form.email.trim().toLowerCase())) {
      onError('An account with this email already exists.');
      return;
    }

    setSaving(true);
    try {
      await createAppUser({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        department: form.department,
        status: form.status,
      });
      onSuccess(`Account created for ${form.name}.`);
    } catch (e: any) {
      const code = e?.code ?? '';
      const msg =
        code === 'auth/email-already-in-use'
          ? 'This email is already registered in Firebase Auth.'
          : code === 'auth/invalid-email'
            ? 'Invalid email address.'
            : code === 'auth/weak-password'
              ? 'Password is too weak (min 6 characters).'
              : e?.message ?? 'Failed to create account.';
      onError(msg);
    } finally {
      setSaving(false);
    }
  };

  // Handle Edit (Firestore only — hindi pine-update ang password/email)
  const handleEdit = async () => {
    if (!user) return;
    if (!form.name.trim()) {
      onError('Name is required.');
      return;
    }
    if (!form.department.trim()) {
      onError('Please select a department.');
      return;
    }

    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.id), {
        name: form.name.trim(),
        role: form.role,
        roleLabel: ROLE_LABELS[form.role],
        department: form.department,
        status: form.status,
        initials: getInitials(form.name),
      });
      onSuccess(`Updated account for ${form.name}.`);
    } catch (e: any) {
      onError(e?.message ?? 'Failed to update account.');
    } finally {
      setSaving(false);
    }
  };

  // Handle Delete
  const handleDelete = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await deleteDoc(doc(db, 'users', user.id));
      onSuccess(`Deleted account for ${user.name}.`);
    } catch (e: any) {
      onError(e?.message ?? 'Failed to delete account.');
    } finally {
      setSaving(false);
    }
  };

  // ============ DELETE MODAL ============
  if (mode === 'delete' && user) {
    return (
      <Modal
        open={open}
        onClose={onClose}
        title="Delete User Account"
        subtitle="This action cannot be undone."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={saving}
            >
              {saving ? 'Deleting…' : 'Delete User'}
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400">
            <Trash2 className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Sigurado ka bang gusto mong i-delete si{' '}
              <span className="font-semibold text-slate-900 dark:text-slate-100">{user.name}</span>?
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Mawawalan ng access si {user.name} sa system. Yung Firebase Auth
              account ay mananatili pero hindi na makaka-access sa dashboard.
            </p>
          </div>
        </div>
      </Modal>
    );
  }

  // ============ ADD / EDIT MODAL ============
  const isEdit = mode === 'edit';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit User Account' : 'Add New User Account'}
      subtitle={
        isEdit
          ? `Update details for ${user?.email}`
          : 'Create a new account for a Registrar or Department Head.'
      }
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={isEdit ? handleEdit : handleAdd}
            disabled={saving}
          >
            {saving
              ? isEdit
                ? 'Saving…'
                : 'Creating…'
              : isEdit
                ? 'Save Changes'
                : 'Create Account'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Info notice for add mode */}
        {!isEdit && (
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 dark:border-blue-500/30 dark:bg-blue-500/10">
            <div className="flex items-start gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                <ShieldCheck className="h-3.5 w-3.5" />
              </span>
              <div>
                <p className="text-xs font-semibold text-blue-900 dark:text-blue-200">
                  Firebase Authentication Account
                </p>
                <p className="mt-0.5 text-[11px] text-blue-700 dark:text-blue-300/80">
                  Ang bagong user ay makakapag-login gamit ang email at password
                  na itatakda mo. Siguraduhing ibahagi sa kanila ang credentials.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={LABEL_CLASS}>Full Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Juan Dela Cruz"
              className={INPUT_CLASS}
            />
          </div>

          <div className="sm:col-span-2">
            <label className={LABEL_CLASS}>Email Address *</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="user@school.edu"
                disabled={isEdit}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-blue-500 dark:focus:ring-blue-500/20 dark:disabled:bg-slate-800/50 dark:disabled:text-slate-500"
              />
            </div>
            {isEdit && (
              <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                Email cannot be changed once the account is created.
              </p>
            )}
          </div>

          {!isEdit && (
            <div className="sm:col-span-2">
              <label className={LABEL_CLASS}>Password *</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Minimum 6 characters"
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                Ibibigay mo 'to sa user. Pwede nilang baguhin mamaya sa Settings.
              </p>
            </div>
          )}

          <div>
            <label className={LABEL_CLASS}>Role *</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
              className={INPUT_CLASS}
              disabled={user?.role === 'admin'}
            >
              <option value="registrar">Registrar / Enrollment Officer</option>
              <option value="department-head">Department Head</option>
              <option value="admin">School Administrator</option>
            </select>
            {user?.role === 'admin' && (
              <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400">
                Cannot change role for administrator accounts.
              </p>
            )}
          </div>

          <div>
            <label className={LABEL_CLASS}>Status</label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as UserStatus })
              }
              className={INPUT_CLASS}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className={LABEL_CLASS}>Department *</label>
            {departments.length === 0 ? (
              // 🛠️ Empty state when no departments exist in Reference Data
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/30 dark:bg-amber-500/10">
                <p className="text-xs text-amber-800 dark:text-amber-300/80">
                  <span className="font-semibold dark:text-amber-200">No departments available.</span>{' '}
                  Please add programs with their departments in the Reference Data page first.
                </p>
              </div>
            ) : (
              <select
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className={INPUT_CLASS}
              >
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            )}
            <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
              Departments are pulled from Reference Data (Programs).
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ============ HELPERS ============
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