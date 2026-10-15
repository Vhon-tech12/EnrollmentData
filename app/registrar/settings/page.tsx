'use client';

import { useState } from 'react';
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
  ClipboardList,
  Info,
} from 'lucide-react';
import {
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import {
  useUserProfile,
  type UserProfile,
  type UserPrefs,
  DEFAULT_PREFS,
} from '@/lib/useUserProfile';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

type TabKey = 'profile' | 'notifications' | 'security' | 'enrollment-prefs';

const TABS: { key: TabKey; label: string; icon: typeof User }[] = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'security', label: 'Security', icon: Lock },
  { key: 'enrollment-prefs', label: 'Enrollment Preferences', icon: ClipboardList },
];

// 🛠️ Dark mode enabled
const INPUT_CLASS =
  'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-500/20 dark:disabled:bg-slate-800/50 dark:disabled:text-slate-500';

const LABEL_CLASS =
  'mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400';

export default function RegistrarSettingsPage() {
  const { user, loading: authLoading } = useCurrentUser();
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

  if (authLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600 dark:border-blue-900 dark:border-t-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:border dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400">
          <SettingsIcon className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Settings
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage your profile, notifications, security, and enrollment preferences.
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-500/30 dark:bg-blue-500/10">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
            <Info className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-semibold text-blue-900 dark:text-blue-200">
              All settings are saved to your account
            </p>
            <p className="mt-0.5 text-xs text-blue-700 dark:text-blue-300/80">
              Your preferences are stored in Firestore and persist across sessions
              and devices. Password changes use Firebase Authentication.
            </p>
          </div>
        </div>
      </div>

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

      {activeTab === 'profile' && (
        <ProfileTab
          profile={profile}
          email={user?.email ?? ''}
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
      {activeTab === 'notifications' && (
        <NotificationsTab
          prefs={prefs}
          email={user?.email ?? ''}
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
      {activeTab === 'enrollment-prefs' && (
        <EnrollmentPrefsTab
          prefs={prefs}
          onSave={async (data) => {
            try {
              await savePrefs(data);
              showToast('Enrollment preferences saved.');
            } catch (e: any) {
              showToast('Failed to save: ' + e.message, 'error');
            }
          }}
        />
      )}

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
  onSave,
}: {
  profile: UserProfile | null;
  email: string;
  onSave: (data: UserProfile) => Promise<void>;
}) {
  const [form, setForm] = useState<UserProfile>({
    name: profile?.name ?? 'Maria Delos Santos',
    email: profile?.email ?? email,
    phone: profile?.phone ?? '',
    bio: profile?.bio ?? '',
    department: profile?.department ?? 'Office of the Registrar',
    employeeId: profile?.employeeId ?? 'REG-2024-001',
  });
  const [saving, setSaving] = useState(false);

  const initials = form.name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

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
    <Card className="shadow-lg dark:border-slate-800 dark:bg-slate-900">
      <CardHeader
        title="Profile Information"
        subtitle="Update your personal information and account details."
      />
      <CardBody>
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="flex flex-col items-center gap-3 lg:w-48">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-600 text-3xl font-semibold text-white shadow-md">
              {initials || '??'}
            </div>
            <p className="text-center text-[11px] text-slate-400 dark:text-slate-500">
              Profile photo upload is planned for a future phase.
            </p>
          </div>

          <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={LABEL_CLASS}>Full Name</label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
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
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
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
                className={INPUT_CLASS}
              />
            </div>

            <div className="sm:col-span-2">
              <label className={LABEL_CLASS}>Department</label>
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className={LABEL_CLASS}>Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={3}
                placeholder="Short description about your role..."
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
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

// ============ NOTIFICATIONS TAB ============
function NotificationsTab({
  prefs,
  email,
  onSave,
}: {
  prefs: UserPrefs;
  email: string;
  onSave: (data: UserPrefs) => Promise<void>;
}) {
  const [local, setLocal] = useState(prefs);
  const [saving, setSaving] = useState(false);

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

  const handleReset = () => {
    setLocal({ ...local, notifications: DEFAULT_PREFS.notifications });
  };

  return (
    <div className="space-y-6">
      {/* Honest note */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
            <Info className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
              About notifications
            </p>
            <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-300/80">
              Your preferences are saved to your account. Automatic delivery
              (email, browser push) requires a backend scheduler and is planned
              for a future phase. In-app notifications appear via the bell icon.
            </p>
          </div>
        </div>
      </div>

      <Card className="shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <CardHeader
          title="Enrollment Alerts"
          subtitle="Notifications related to enrollment operations."
        />
        <CardBody className="space-y-1">
          <ToggleRow
            label="New Enrollment Submission"
            description="Notify when a new enrollment record is submitted"
            checked={local.notifications.newSubmission}
            onChange={() => toggle('newSubmission')}
          />
          <ToggleRow
            label="Pending Verification Reminder"
            description="Daily reminder of records awaiting verification"
            checked={local.notifications.pendingReminder}
            onChange={() => toggle('pendingReminder')}
          />
          <ToggleRow
            label="Cancelled Enrollment Alert"
            description="Notify when an enrollment record is cancelled"
            checked={local.notifications.cancelledEnrollment}
            onChange={() => toggle('cancelledEnrollment')}
          />
        </CardBody>
      </Card>

      <Card className="shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <CardHeader
          title="Reports & Summaries"
          subtitle="Automated reports and digest notifications."
        />
        <CardBody className="space-y-1">
          <ToggleRow
            label="Daily Enrollment Summary"
            description="Receive a daily summary of enrollment activity"
            checked={local.notifications.dailySummary}
            onChange={() => toggle('dailySummary')}
          />
          <ToggleRow
            label="Weekly Report Digest"
            description="Get a weekly digest of enrollment reports"
            checked={local.notifications.weeklyReport}
            onChange={() => toggle('weeklyReport')}
          />
        </CardBody>
      </Card>

      <Card className="shadow-lg dark:border-slate-800 dark:bg-slate-900">
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
        <Button variant="secondary" onClick={handleReset}>
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
          checked ? 'bg-blue-600 dark:bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'
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
      <Card className="shadow-lg dark:border-slate-800 dark:bg-slate-900">
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
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
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

// ============ ENROLLMENT PREFS TAB ============
function EnrollmentPrefsTab({
  prefs,
  onSave,
}: {
  prefs: UserPrefs;
  onSave: (data: UserPrefs) => Promise<void>;
}) {
  const [local, setLocal] = useState(prefs);
  const [saving, setSaving] = useState(false);

  const updateEnrollment = <K extends keyof typeof local.enrollment>(
    key: K,
    value: (typeof local.enrollment)[K],
  ) => {
    setLocal({
      ...local,
      enrollment: { ...local.enrollment, [key]: value },
    });
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(local);
    setSaving(false);
  };

  const handleReset = () => {
    setLocal({ ...local, enrollment: DEFAULT_PREFS.enrollment });
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <CardHeader
          title="Default Values"
          subtitle="Pre-selected values when adding new records and applying filters."
        />
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={LABEL_CLASS}>Default Academic Year</label>
            <select
              value={local.enrollment.defaultAcademicYear}
              onChange={(e) => updateEnrollment('defaultAcademicYear', e.target.value)}
              className={INPUT_CLASS}
            >
              <option value="2025-2026">2025-2026</option>
              <option value="2024-2025">2024-2025</option>
              <option value="2023-2024">2023-2024</option>
            </select>
          </div>

          <div>
            <label className={LABEL_CLASS}>Default Status</label>
            <select
              value={local.enrollment.defaultStatus}
              onChange={(e) => updateEnrollment('defaultStatus', e.target.value)}
              className={INPUT_CLASS}
            >
              <option value="Pending">Pending</option>
              <option value="Enrolled">Enrolled</option>
            </select>
          </div>

          <div>
            <label className={LABEL_CLASS}>Default Program (optional)</label>
            <select
              value={local.enrollment.defaultProgram}
              onChange={(e) => updateEnrollment('defaultProgram', e.target.value)}
              className={INPUT_CLASS}
            >
              <option value="">None (show all)</option>
              <option value="BSIT">BSIT</option>
              <option value="BSCS">BSCS</option>
              <option value="BSBA">BSBA</option>
              <option value="BSA">BSA</option>
              <option value="BSED">BSED</option>
            </select>
          </div>

          <div>
            <label className={LABEL_CLASS}>Default Year Level (optional)</label>
            <select
              value={local.enrollment.defaultYearLevel}
              onChange={(e) => updateEnrollment('defaultYearLevel', e.target.value)}
              className={INPUT_CLASS}
            >
              <option value="">None (show all)</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>
          </div>
        </CardBody>
      </Card>

      <Card className="shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <CardHeader
          title="Import & Export"
          subtitle="Control the default behavior for data import and export."
        />
        <CardBody className="space-y-4">
          <ToggleRow
            label="Auto-verify imported records"
            description="Automatically set imported records to 'Enrolled' status"
            checked={local.enrollment.autoVerify}
            onChange={() =>
              updateEnrollment('autoVerify', !local.enrollment.autoVerify)
            }
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLASS}>Records per Page</label>
              <select
                value={local.enrollment.recordsPerPage}
                onChange={(e) => updateEnrollment('recordsPerPage', e.target.value)}
                className={INPUT_CLASS}
              >
                <option value="10">10</option>
                <option value="15">15</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>

            <div>
              <label className={LABEL_CLASS}>Preferred Export Format</label>
              <select
                value={local.enrollment.exportFormat}
                onChange={(e) => updateEnrollment('exportFormat', e.target.value)}
                className={INPUT_CLASS}
              >
                <option value="xlsx">Excel (.xlsx)</option>
                <option value="csv">CSV (.csv)</option>
                <option value="pdf">PDF (.pdf)</option>
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button variant="secondary" onClick={handleReset}>
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