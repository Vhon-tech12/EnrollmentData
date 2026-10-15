'use client';

import { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Lock,
  Palette,
  Globe,
  Shield,
  Check,
  AlertTriangle,
  Save,
  Mail,
  Briefcase,
  Building2,
  Bell,
  ClipboardList,
} from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRole } from '@/components/RoleProvider';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { useTheme, type Theme } from '@/components/ThemeProvider';

type TabKey = 'profile' | 'preferences' | 'security' | 'system';

const TABS: { key: TabKey; label: string; icon: typeof User }[] = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'preferences', label: 'Preferences', icon: Palette },
  { key: 'security', label: 'Security', icon: Lock },
  { key: 'system', label: 'System', icon: SettingsIcon },
];

const INPUT_CLASS =
  'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500 dark:disabled:bg-slate-900 dark:disabled:text-slate-500';

const LABEL_CLASS =
  'mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400';

// Helper: Get initials from name
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function AdminSettingsPage() {
  const { user } = useRole(); // 🛠️ Get the actual logged-in user
  const [activeTab, setActiveTab] = useState<TabKey>('profile');
  const [toast, setToast] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
          <SettingsIcon className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Settings
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage your account profile, preferences, and system configuration.
          </p>
        </div>
      </div>

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
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${
                    active
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'profile' && (
        <ProfileTab
          user={user}
          onSave={() => showToast('Profile updated successfully.')}
        />
      )}
      {activeTab === 'preferences' && (
        <PreferencesTab onSave={() => showToast('Preferences saved successfully.')} />
      )}
      {activeTab === 'security' && (
        <SecurityTab onSave={() => showToast('Password changed successfully.')} />
      )}
      {activeTab === 'system' && (
        <SystemTab
          onSave={() => showToast('System settings saved successfully.')}
          onDeleteClick={() => setShowDeleteModal(true)}
        />
      )}

      {/* Delete confirmation modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Account"
        subtitle="This action cannot be undone."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setShowDeleteModal(false);
                showToast('Account deletion requested.');
              }}
            >
              Delete Account
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Are you sure you want to delete your account?
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              This will permanently remove your profile, permissions, and all
              associated data. You will not be able to undo this action.
            </p>
          </div>
        </div>
      </Modal>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[60]">
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3 shadow-lg dark:border-emerald-800 dark:bg-slate-900">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
              <Check className="h-3.5 w-3.5" />
            </span>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
              {toast}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ PROFILE TAB ============
function ProfileTab({
  user,
  onSave,
}: {
  user: any;
  onSave: () => void;
}) {
  // 🛠️ Initialize form with the actual logged-in user's data
  const [form, setForm] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    department: user?.department ?? '',
    role: user?.roleLabel ?? 'User',
    bio: user?.bio ?? '',
  });
  const [saving, setSaving] = useState(false);

  // 🛠️ Update form when user data loads/changes (e.g., after refetch)
  useEffect(() => {
    if (user) {
      setForm({
        name: user.name ?? '',
        email: user.email ?? '',
        department: user.department ?? '',
        role: user.roleLabel ?? 'User',
        bio: user.bio ?? '',
      });
    }
  }, [user]);

  const initials = getInitials(form.name || 'User');

  // 🛠️ Save changes to Firestore
  const handleSave = async () => {
    if (!user?.id) {
      onSave();
      return;
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.id), {
        name: form.name.trim(),
        department: form.department.trim(),
        bio: form.bio.trim(),
        initials: getInitials(form.name),
      });
      onSave();
    } catch (e: any) {
      console.error('Failed to update profile:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="shadow-lg dark:border-slate-800 dark:bg-slate-900">
      <CardHeader
        title="Profile Information"
        subtitle="Update your personal information and account details."
      />
      <CardBody>
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Avatar section */}
          <div className="flex flex-col items-center gap-3 lg:w-48">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-600 text-3xl font-semibold text-white shadow-md">
              {initials}
            </div>
            <Button variant="secondary" size="sm">
              Change Photo
            </Button>
            <p className="text-center text-[11px] text-slate-400 dark:text-slate-500">
              JPG or PNG · Max 2 MB
            </p>
          </div>

          {/* Form section */}
          <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={LABEL_CLASS}>Full Name</label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className={LABEL_CLASS}>Email Address</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  type="email"
                  value={form.email}
                  disabled
                  className={`${INPUT_CLASS} pl-9`}
                />
              </div>
              <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                Email cannot be changed. Contact system administrator.
              </p>
            </div>

            <div>
              <label className={LABEL_CLASS}>Department</label>
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            <div>
              <label className={LABEL_CLASS}>Role</label>
              <div className="relative">
                <Briefcase className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  value={form.role}
                  disabled
                  className={`${INPUT_CLASS} pl-9`}
                />
              </div>
              <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                Role is managed by the system administrator.
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className={LABEL_CLASS}>Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={3}
                placeholder="Tell us a bit about yourself..."
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          <Button variant="secondary">Cancel</Button>
          <Button onClick={handleSave} disabled={saving} icon={<Save className="h-4 w-4" />}>
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

// ============ PREFERENCES TAB ============
function PreferencesTab({ onSave }: { onSave: () => void }) {
  const { theme, setTheme } = useTheme();
  const [prefs, setPrefs] = useState({
    language: 'en',
    dateFormat: 'US',
    notifications: {
      email: true,
      browser: true,
      enrollmentUpdates: true,
      reportGenerated: false,
      userActivity: false,
    },
  });

  const toggle = (key: keyof typeof prefs.notifications) =>
    setPrefs({
      ...prefs,
      notifications: { ...prefs.notifications, [key]: !prefs.notifications[key] },
    });

  const handleThemeChange = (next: Theme) => {
    setTheme(next);
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader
          title="Display Preferences"
          subtitle="Customize how the system looks and feels."
        />
        <CardBody className="space-y-4">
          <div>
            <label className={LABEL_CLASS}>Theme</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  value: 'light' as Theme,
                  label: 'Light',
                  preview: 'bg-white border-slate-300',
                },
                {
                  value: 'dark' as Theme,
                  label: 'Dark',
                  preview: 'bg-slate-900 border-slate-700',
                },
                {
                  value: 'system' as Theme,
                  label: 'System',
                  preview:
                    'bg-gradient-to-br from-white to-slate-900 border-slate-300',
                },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleThemeChange(opt.value)}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all ${
                    theme === opt.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40'
                      : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
                  }`}
                >
                  <span className={`h-10 w-full rounded-md border ${opt.preview}`} />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {opt.label}
                  </span>
                  {theme === opt.value && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-white">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                  )}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
              Theme is applied instantly and saved to your browser.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLASS}>Language</label>
              <div className="relative">
                <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <select
                  value={prefs.language}
                  onChange={(e) => setPrefs({ ...prefs, language: e.target.value })}
                  className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="en">English</option>
                  <option value="fil">Filipino</option>
                  <option value="es">Spanish</option>
                </select>
              </div>
            </div>

            <div>
              <label className={LABEL_CLASS}>Date Format</label>
              <select
                value={prefs.dateFormat}
                onChange={(e) => setPrefs({ ...prefs, dateFormat: e.target.value })}
                className={INPUT_CLASS}
              >
                <option value="US">MM/DD/YYYY (US)</option>
                <option value="EU">DD/MM/YYYY (EU)</option>
                <option value="ISO">YYYY-MM-DD (ISO)</option>
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="shadow-lg">
        <CardHeader
          title="Notifications"
          subtitle="Choose which updates you want to receive."
        />
        <CardBody className="space-y-1">
          <ToggleRow
            label="Email Notifications"
            description="Receive system updates via email"
            checked={prefs.notifications.email}
            onChange={() => toggle('email')}
          />
          <ToggleRow
            label="Browser Notifications"
            description="Show desktop notifications in your browser"
            checked={prefs.notifications.browser}
            onChange={() => toggle('browser')}
          />
          <ToggleRow
            label="Enrollment Updates"
            description="Notify when new enrollment records are added"
            checked={prefs.notifications.enrollmentUpdates}
            onChange={() => toggle('enrollmentUpdates')}
          />
          <ToggleRow
            label="Report Generated"
            description="Notify when a report finishes generating"
            checked={prefs.notifications.reportGenerated}
            onChange={() => toggle('reportGenerated')}
          />
          <ToggleRow
            label="User Activity Alerts"
            description="Notify about suspicious or unusual account activity"
            checked={prefs.notifications.userActivity}
            onChange={() => toggle('userActivity')}
          />
        </CardBody>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button variant="secondary">Reset to Defaults</Button>
        <Button onClick={onSave} icon={<Save className="h-4 w-4" />}>
          Save Preferences
        </Button>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl px-3 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
          {label}
        </p>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 ${
          checked ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

// ============ SECURITY TAB ============
function SecurityTab({ onSave }: { onSave: () => void }) {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [twoFactor, setTwoFactor] = useState(false);

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader
          title="Change Password"
          subtitle="Use a strong password to keep your account secure."
        />
        <CardBody className="space-y-4">
          <div>
            <label className={LABEL_CLASS}>Current Password</label>
            <input
              type="password"
              value={form.currentPassword}
              onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
              placeholder="Enter current password"
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>New Password</label>
            <input
              type="password"
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              placeholder="Enter new password"
              className={INPUT_CLASS}
            />
            <div className="mt-2 space-y-1">
              <PasswordRule
                label="At least 8 characters"
                met={form.newPassword.length >= 8}
              />
              <PasswordRule
                label="Contains uppercase letter"
                met={/[A-Z]/.test(form.newPassword)}
              />
              <PasswordRule
                label="Contains a number"
                met={/[0-9]/.test(form.newPassword)}
              />
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>Confirm New Password</label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              placeholder="Re-enter new password"
              className={INPUT_CLASS}
            />
            {form.confirmPassword && form.newPassword !== form.confirmPassword && (
              <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
                Passwords do not match.
              </p>
            )}
          </div>
        </CardBody>
      </Card>

      <Card className="shadow-lg">
        <CardHeader
          title="Two-Factor Authentication"
          subtitle="Add an extra layer of security to your account."
        />
        <CardBody>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                <Shield className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {twoFactor
                    ? 'Two-Factor Authentication is ON'
                    : 'Two-Factor Authentication is OFF'}
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {twoFactor
                    ? 'Your account is protected with an additional verification step.'
                    : 'Secure your account with an additional verification step during login.'}
                </p>
              </div>
            </div>
            <Button
              variant={twoFactor ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => setTwoFactor(!twoFactor)}
            >
              {twoFactor ? 'Disable' : 'Enable 2FA'}
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card className="shadow-lg">
        <CardHeader
          title="Active Sessions"
          subtitle="Devices currently logged in to your account."
        />
        <CardBody className="space-y-2">
          <SessionRow
            device="Chrome on Windows"
            location="Manila, PH"
            lastActive="Active now"
            current
          />
          <SessionRow
            device="Edge on Windows"
            location="Manila, PH"
            lastActive="2 hours ago"
          />
        </CardBody>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button variant="secondary">Cancel</Button>
        <Button onClick={onSave} icon={<Save className="h-4 w-4" />}>
          Update Password
        </Button>
      </div>
    </div>
  );
}

function PasswordRule({ label, met }: { label: string; met: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span
        className={`flex h-4 w-4 items-center justify-center rounded-full ${
          met
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
            : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
        }`}
      >
        {met ? (
          <Check className="h-2.5 w-2.5" />
        ) : (
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
        )}
      </span>
      <span
        className={
          met
            ? 'text-emerald-700 dark:text-emerald-400'
            : 'text-slate-500 dark:text-slate-400'
        }
      >
        {label}
      </span>
    </div>
  );
}

function SessionRow({
  device,
  location,
  lastActive,
  current = false,
}: {
  device: string;
  location: string;
  lastActive: string;
  current?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-700">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          <Globe className="h-4 w-4" />
        </span>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
              {device}
            </p>
            {current && (
              <Badge tone="success" dot>
                Current
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {location} · {lastActive}
          </p>
        </div>
      </div>
      {!current && (
        <button
          type="button"
          className="text-xs font-medium text-red-600 transition-colors hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
        >
          Revoke
        </button>
      )}
    </div>
  );
}

// ============ SYSTEM TAB ============
function SystemTab({
  onSave,
  onDeleteClick,
}: {
  onSave: () => void;
  onDeleteClick: () => void;
}) {
  const [system, setSystem] = useState({
    institutionName: 'State University',
    currentAY: '2025-2026',
    enrollmentOpen: true,
    autoBackup: true,
    maintenanceMode: false,
    recordsPerPage: '15',
  });

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader
          title="Institution Information"
          subtitle="Basic configuration for your school or institution."
        />
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={LABEL_CLASS}>Institution Name</label>
            <input
              type="text"
              value={system.institutionName}
              onChange={(e) =>
                setSystem({ ...system, institutionName: e.target.value })
              }
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Current Academic Year</label>
            <select
              value={system.currentAY}
              onChange={(e) => setSystem({ ...system, currentAY: e.target.value })}
              className={INPUT_CLASS}
            >
              <option value="2025-2026">2025-2026</option>
              <option value="2024-2025">2024-2025</option>
              <option value="2023-2024">2023-2024</option>
            </select>
          </div>

          <div>
            <label className={LABEL_CLASS}>Records per Page</label>
            <select
              value={system.recordsPerPage}
              onChange={(e) =>
                setSystem({ ...system, recordsPerPage: e.target.value })
              }
              className={INPUT_CLASS}
            >
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </div>
        </CardBody>
      </Card>

      <Card className="shadow-lg">
        <CardHeader
          title="System Toggles"
          subtitle="Enable or disable system-wide features."
        />
        <CardBody className="space-y-1">
          <ToggleRow
            label="Enrollment Period Open"
            description="Allow new enrollment records to be added"
            checked={system.enrollmentOpen}
            onChange={() =>
              setSystem({ ...system, enrollmentOpen: !system.enrollmentOpen })
            }
          />
          <ToggleRow
            label="Automatic Daily Backup"
            description="Automatically back up enrollment data every day"
            checked={system.autoBackup}
            onChange={() => setSystem({ ...system, autoBackup: !system.autoBackup })}
          />
          <ToggleRow
            label="Maintenance Mode"
            description="Temporarily disable access for non-administrator users"
            checked={system.maintenanceMode}
            onChange={() =>
              setSystem({ ...system, maintenanceMode: !system.maintenanceMode })
            }
          />
        </CardBody>
      </Card>

      <Card className="shadow-lg">
        <CardHeader
          title="Danger Zone"
          subtitle="Irreversible actions. Proceed with caution."
        />
        <CardBody>
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/40">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-900 dark:text-red-300">
                Delete Account
              </p>
              <p className="mt-0.5 text-xs text-red-700 dark:text-red-400">
                Once you delete your account, there is no going back. All data
                associated with your profile will be permanently removed.
              </p>
            </div>
            <Button variant="danger" size="sm" onClick={onDeleteClick}>
              Delete
            </Button>
          </div>
        </CardBody>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button variant="secondary">Reset</Button>
        <Button onClick={onSave} icon={<Save className="h-4 w-4" />}>
          Save System Settings
        </Button>
      </div>
    </div>
  );
}