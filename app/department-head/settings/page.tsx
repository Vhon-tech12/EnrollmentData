'use client';

import { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Lock,
  Bell,
  Check,
  AlertTriangle,
  Save,
  Mail,
  Building2,
  Info,
} from 'lucide-react';
import {
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useCurrentDepartment } from '@/lib/useCurrentDepartment';
import {
  useUserProfile,
  type UserProfile,
  type UserPrefs,
  DEFAULT_PREFS,
} from '@/lib/useUserProfile';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useTheme, type Theme } from '@/components/ThemeProvider';

type TabKey = 'profile' | 'preferences' | 'notifications' | 'security';

const TABS: { key: TabKey; label: string; icon: typeof User }[] = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'preferences', label: 'Preferences', icon: SettingsIcon },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'security', label: 'Security', icon: Lock },
];

const INPUT_CLASS =
  'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500';

const LABEL_CLASS =
  'mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400';

export default function DepartmentHeadSettingsPage() {
  const { user, loading: authLoading } = useCurrentUser();
  const { department, loading: deptLoading } = useCurrentDepartment();
  const {
    profile,
    prefs,
    loading: profileLoading,
    saveProfile,
    savePrefs,
  } = useUserProfile(user?.uid);

  const [activeTab, setActiveTab] = useState<TabKey>('profile');
  const [toast, setToast] = useState<{ msg: string; tone: 'success' | 'error' } | null>(
    null,
  );

  const showToast = (msg: string, tone: 'success' | 'error' = 'success') => {
    setToast({ msg, tone });
    setTimeout(() => setToast(null), 3500);
  };

  if (authLoading || profileLoading || deptLoading || !department) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600 dark:border-blue-900 dark:border-t-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
          <SettingsIcon className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Settings
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage your profile, preferences, and security settings.
          </p>
        </div>
      </div>

      {/* Department info card */}
      <Card className="shadow-lg">
        <CardHeader
          title="Department Information"
          subtitle="Your assigned department and programs."
        />
        <CardBody>
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <Building2 className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {department.name}
              </p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Short name: {department.shortName}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {department.programs.length > 0 ? (
                  department.programs.map((p) => (
                    <Badge key={p} tone="brand">
                      {p}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs italic text-slate-400 dark:text-slate-500">
                    No programs assigned
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/40">
            <p className="text-[11px] text-blue-800 dark:text-blue-300">
              <span className="font-semibold">Note:</span> Department assignment
              is managed by the School Administrator.
            </p>
          </div>
        </CardBody>
      </Card>

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
          profile={profile}
          email={user?.email ?? ''}
          departmentName={department.name}
          onSave={async (data) => {
            try {
              await saveProfile(data);
              showToast('Profile saved successfully.');
            } catch (e: any) {
              showToast('Failed to save profile: ' + e.message, 'error');
            }
          }}
        />
      )}
      {activeTab === 'preferences' && <PreferencesTab />}
      {activeTab === 'notifications' && (
        <NotificationsTab
          prefs={prefs}
          email={user?.email ?? ''}
          departmentName={department.name}
          programs={department.programs}
          onSave={async (data) => {
            try {
              await savePrefs(data);
              showToast('Notification preferences saved.');
            } catch (e: any) {
              showToast('Failed to save: ' + e.message, 'error');
            }
          }}
        />
      )}
      {activeTab === 'security' && (
        <SecurityTab email={user?.email ?? ''} onToast={showToast} />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[70]">
          <div
            className={`flex items-center gap-3 rounded-xl border bg-white px-4 py-3 shadow-lg dark:bg-slate-900 ${
              toast.tone === 'success'
                ? 'border-emerald-200 dark:border-emerald-800'
                : 'border-red-200 dark:border-red-800'
            }`}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full ${
                toast.tone === 'success'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400'
              }`}
            >
              {toast.tone === 'success' ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5" />
              )}
            </span>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
              {toast.msg}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ PROFILE TAB ============
function ProfileTab({
  profile,
  email,
  departmentName,
  onSave,
}: {
  profile: UserProfile | null;
  email: string;
  departmentName: string;
  onSave: (data: UserProfile) => Promise<void>;
}) {
  const [form, setForm] = useState<UserProfile>({
    name: profile?.name ?? '',
    email: profile?.email ?? email,
    phone: profile?.phone ?? '',
    bio: profile?.bio ?? '',
    department: profile?.department ?? departmentName,
    employeeId: profile?.employeeId ?? '',
  });
  const [saving, setSaving] = useState(false);

  // Sync form when profile loads
  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name ?? '',
        email: profile.email ?? email,
        phone: profile.phone ?? '',
        bio: profile.bio ?? '',
        department: profile.department ?? departmentName,
        employeeId: profile.employeeId ?? '',
      });
    }
  }, [profile, email, departmentName]);

  const initials = form.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');

  const handleSave = async () => {
    if (!form.name.trim()) {
      alert('Name is required.');
      return;
    }
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader
        title="Profile Information"
        subtitle="Update your personal information and account details."
      />
      <CardBody>
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3 lg:w-48">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-600 text-3xl font-semibold text-white shadow-md">
              {initials || '??'}
            </div>
            <p className="text-center text-[11px] text-slate-400 dark:text-slate-500">
              Profile photo upload is planned for a future phase.
            </p>
          </div>

          {/* Form */}
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
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            <div>
              <label className={LABEL_CLASS}>Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+63 900 000 0000"
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>Employee ID</label>
              <input
                type="text"
                value={form.employeeId}
                onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                placeholder="DH-2024-001"
                className={INPUT_CLASS}
              />
            </div>

            <div className="sm:col-span-2">
              <label className={LABEL_CLASS}>Department</label>
              <input
                type="text"
                value={form.department}
                disabled
                className={INPUT_CLASS}
              />
              <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                Department is managed by the System Administrator.
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className={LABEL_CLASS}>Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={3}
                placeholder="Short description about your role..."
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          <Button
            onClick={handleSave}
            disabled={saving}
            icon={<Save className="h-4 w-4" />}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

// ============ PREFERENCES TAB ============
function PreferencesTab() {
  const { theme, setTheme } = useTheme();

  const handleThemeChange = (next: Theme) => {
    setTheme(next);
  };

  return (
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
                preview: 'bg-gradient-to-br from-white to-slate-900 border-slate-300',
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
      </CardBody>
    </Card>
  );
}

// ============ NOTIFICATIONS TAB ============
function NotificationsTab({
  prefs,
  email,
  departmentName,
  programs,
  onSave,
}: {
  prefs: UserPrefs;
  email: string;
  departmentName: string;
  programs: string[];
  onSave: (data: UserPrefs) => Promise<void>;
}) {
  const [local, setLocal] = useState(prefs);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLocal(prefs);
  }, [prefs]);

  const toggle = (key: keyof typeof local.notifications) =>
    setLocal({
      ...local,
      notifications: { ...local.notifications, [key]: !local.notifications[key] },
    });

  const handleSave = async () => {
    setSaving(true);
    await onSave(local);
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400">
            <Info className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-semibold text-amber-900 dark:text-amber-300">
              About notifications
            </p>
            <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
              Your preferences are saved to your account. Automatic delivery
              requires a backend scheduler and is planned for a future phase.
            </p>
          </div>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader
          title={`${departmentName} Alerts`}
          subtitle="Notifications related to your department."
        />
        <CardBody className="space-y-1">
          <ToggleRow
            label="New Enrollment in Department"
            description={
              programs.length > 0
                ? `Notify when a student enrolls in ${programs.join(' or ')}`
                : 'Notify when a student enrolls in your department'
            }
            checked={local.notifications.newSubmission}
            onChange={() => toggle('newSubmission')}
          />
          <ToggleRow
            label="Pending Verification"
            description="Notify about pending enrollment records in your department"
            checked={local.notifications.pendingReminder}
            onChange={() => toggle('pendingReminder')}
          />
          <ToggleRow
            label="Cancelled Enrollment"
            description="Notify when an enrollment is cancelled"
            checked={local.notifications.cancelledEnrollment}
            onChange={() => toggle('cancelledEnrollment')}
          />
        </CardBody>
      </Card>

      <Card className="shadow-lg">
        <CardHeader
          title="Reports & Summaries"
          subtitle="Automated reports for your department."
        />
        <CardBody className="space-y-1">
          <ToggleRow
            label="Weekly Department Digest"
            description="Receive a weekly summary of department enrollment"
            checked={local.notifications.dailySummary}
            onChange={() => toggle('dailySummary')}
          />
          <ToggleRow
            label="Monthly Report"
            description="Get a detailed monthly enrollment report"
            checked={local.notifications.weeklyReport}
            onChange={() => toggle('weeklyReport')}
          />
        </CardBody>
      </Card>

      <Card className="shadow-lg">
        <CardHeader
          title="Delivery Channels"
          subtitle="How do you want to receive notifications?"
        />
        <CardBody className="space-y-1">
          <ToggleRow
            label="Email Notifications"
            description={`Send notifications to ${email}`}
            checked={local.notifications.emailNotifications}
            onChange={() => toggle('emailNotifications')}
          />
          <ToggleRow
            label="In-App Notifications"
            description="Show notifications in the bell icon"
            checked={local.notifications.browserNotifications}
            onChange={() => toggle('browserNotifications')}
          />
        </CardBody>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button
          variant="secondary"
          onClick={() =>
            setLocal({ ...local, notifications: DEFAULT_PREFS.notifications })
          }
        >
          Reset to Defaults
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          icon={<Save className="h-4 w-4" />}
        >
          {saving ? 'Saving…' : 'Save Preferences'}
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
function SecurityTab({
  email,
  onToast,
}: {
  email: string;
  onToast: (msg: string, tone?: 'success' | 'error') => void;
}) {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async () => {
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      onToast('Please fill in all password fields.', 'error');
      return;
    }
    if (form.newPassword.length < 8) {
      onToast('New password must be at least 8 characters.', 'error');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      onToast('New passwords do not match.', 'error');
      return;
    }
    if (!auth.currentUser) {
      onToast('You are not logged in.', 'error');
      return;
    }

    setSaving(true);
    try {
      const credential = EmailAuthProvider.credential(email, form.currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, form.newPassword);
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      onToast('Password changed successfully.');
    } catch (e: any) {
      const code = e?.code ?? '';
      const msg =
        code === 'auth/wrong-password' || code === 'auth/invalid-credential'
          ? 'Current password is incorrect.'
          : code === 'auth/requires-recent-login'
            ? 'Session expired. Please log out and log in again.'
            : code === 'auth/weak-password'
              ? 'New password is too weak.'
              : e?.message ?? 'Failed to change password.';
      onToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader
          title="Change Password"
          subtitle="Update your account password. This change is applied immediately."
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

      <div className="flex items-center justify-end gap-2">
        <Button
          onClick={handleChangePassword}
          disabled={saving}
          icon={<Save className="h-4 w-4" />}
        >
          {saving ? 'Updating…' : 'Update Password'}
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