'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import Image from 'next/image';
import Link from 'next/link';
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Shield,
} from 'lucide-react';

// ============ ROLE → REDIRECT MAPPING ============
const ROLE_REDIRECT: Record<string, string> = {
  admin: '/admin/dashboard',
  registrar: '/registrar/dashboard',
  'department-head': '/department-head/dashboard',
};

const ROLE_PREFIX: Record<string, string> = {
  admin: '/admin',
  registrar: '/registrar',
  'department-head': '/department-head',
};

// ============ FALLBACK FOR DEFAULT ACCOUNTS ============
const DEFAULT_ACCOUNTS: Record<
  string,
  {
    name: string;
    role: string;
    roleLabel: string;
    department: string;
  }
> = {
  'schooladmin@school.edu': {
    name: 'Daniel Villanueva',
    role: 'admin',
    roleLabel: 'School Administrator',
    department: "President's Office",
  },
  'registrar@school.edu': {
    name: 'Maria Delos Santos',
    role: 'registrar',
    roleLabel: 'Registrar / Enrollment Officer',
    department: 'Office of the Registrar',
  },
  'departmenthead@school.edu': {
    name: 'Engr. Paolo Mendoza',
    role: 'department-head',
    roleLabel: 'Department Head',
    department: 'College of Computer Studies',
  },
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');
}

// ============ COOKIE HELPER ============
function setSessionCookie(
  role: string,
  email: string,
  name: string,
  rememberMe: boolean,
) {
  const data = JSON.stringify({ role, email, name });
  const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24;
  document.cookie = `auth-session=${encodeURIComponent(data)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

// ============ FIREBASE ERROR MESSAGES ============
function getFirebaseErrorMessage(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection.';
    default:
      return 'Login failed. Please try again.';
  }
}

// ============ PAGE WRAPPER ============
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  );
}

// ============ FALLBACK ============
function LoginFallback() {
  return (
    <div className="login-page relative min-h-screen overflow-hidden bg-slate-900">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/85 via-blue-800/75 to-blue-600/65" />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-6 flex flex-col items-center text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md ring-1 ring-white/30 shadow-lg">
              <GraduationCap className="h-8 w-8 text-white" />
            </span>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">
              Enrollment Analytics
            </h1>
          </div>
          <div className="flex items-center justify-center rounded-2xl border border-white/30 bg-white/95 p-8 shadow-2xl backdrop-blur-xl">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ ACTUAL LOGIN CONTENT ============
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  const isLogout = searchParams.get('logout') === '1';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset ALL state on mount — prevents stuck "Signing in..." after logout
  useEffect(() => {
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setError('');
    setLoading(false);
    setInfo('');

    if (isLogout) {
      setInfo('You have been signed out successfully.');
      const url = new URL(window.location.href);
      url.searchParams.delete('logout');
      window.history.replaceState({}, '', url.toString());
      const t = setTimeout(() => setInfo(''), 4000);
      return () => clearTimeout(t);
    }
  }, [isLogout]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );

      const firebaseUser = userCredential.user;
      const uid = firebaseUser.uid;
      const userEmail = (firebaseUser.email ?? '').toLowerCase();

      const userDocRef = doc(db, 'users', uid);
      const userDocSnap = await getDoc(userDocRef);

      let role: string;
      let name: string;
      let status = 'Active';

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        role = userData.role as string;
        name = (userData.name as string) ?? userEmail;
        status = (userData.status as string) ?? 'Active';
      } else {
        const fallback = DEFAULT_ACCOUNTS[userEmail];
        if (!fallback) {
          setError(
            'This account has no profile in the system. Contact your administrator.',
          );
          setLoading(false);
          await auth.signOut();
          return;
        }

        role = fallback.role;
        name = fallback.name;
        status = 'Active';

        try {
          await setDoc(userDocRef, {
            name: fallback.name,
            email: userEmail,
            role: fallback.role,
            roleLabel: fallback.roleLabel,
            department: fallback.department,
            status: 'Active',
            initials: getInitials(fallback.name),
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
          });
        } catch (writeErr) {
          console.warn('Auto-provision failed:', writeErr);
        }
      }

      if (!role || !ROLE_REDIRECT[role]) {
        setError('Your account has an invalid role. Contact your administrator.');
        setLoading(false);
        await auth.signOut();
        return;
      }

      if (status === 'Suspended' || status === 'Inactive') {
        setError(`Your account is ${status}. Contact your administrator.`);
        setLoading(false);
        await auth.signOut();
        return;
      }

      try {
        await setDoc(
          userDocRef,
          { lastLogin: new Date().toISOString() },
          { merge: true },
        );
      } catch {
        // ignore
      }

      setSessionCookie(role, userEmail, name, rememberMe);

      let destination = ROLE_REDIRECT[role];
      if (from && from.startsWith(ROLE_PREFIX[role])) {
        destination = from;
      }

      router.push(destination);
    } catch (err: any) {
      const code = err?.code ?? '';
      setError(getFirebaseErrorMessage(code));
      setLoading(false);
    }
  };

  return (
    <div className="login-page relative min-h-screen overflow-hidden">
      {/* Background image */}
      <Image
        src="/Sumulong-01.png"
        alt="State University Campus"
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />

      {/* Blue gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/90 via-blue-800/80 to-blue-600/70" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-900/40" />

      {/* Decorative blurred orbs */}
      <div className="pointer-events-none absolute -left-32 top-24 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-24 h-96 w-96 rounded-full bg-cyan-400/15 blur-3xl" />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-[440px]">
          {/* Logo */}
          <div className="mb-7 flex flex-col items-center text-center">
            <div className="relative">
              <div className="absolute inset-0 animate-pulse rounded-2xl bg-white/20 blur-xl" />
              <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-white/25 to-white/10 backdrop-blur-xl ring-1 ring-white/40 shadow-2xl">
                <GraduationCap className="h-8 w-8 text-white" />
              </span>
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-white drop-shadow-md">
              Enrollment Analytics
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-blue-100 drop-shadow">
              <Sparkles className="h-3 w-3" />
              Data &amp; Reporting System
            </p>
          </div>

          {/* Glass card */}
          <div className="relative overflow-hidden rounded-3xl border border-white/30 bg-white/[0.97] p-7 shadow-[0_25px_70px_-20px_rgba(0,0,0,0.6)] backdrop-blur-2xl sm:p-8">
            {/* Top accent bar */}
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-600" />

            {/* Header */}
            <div className="mb-6">
              <h2 className="text-[22px] font-bold tracking-tight text-slate-900">
                Welcome back
              </h2>
              <p className="mt-1 text-[13px] text-slate-500">
                Sign in to access your enrollment dashboard.
              </p>
            </div>

            {/* Info banner */}
            {info && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <p className="text-xs text-emerald-700">{info}</p>
              </div>
            )}

            {/* "From" redirect banner */}
            {from && !info && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50 p-3.5">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                <p className="text-xs text-blue-700">
                  Please sign in to access that page.
                </p>
              </div>
            )}

            {/* Error banner */}
            {error && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div className="group">
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@school.edu"
                    autoComplete="off"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-11 pr-4 text-sm text-slate-700 placeholder:text-slate-400 transition-all focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="group">
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="new-password"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-11 pr-12 text-sm text-slate-700 placeholder:text-slate-400 transition-all focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <label className="flex cursor-pointer select-none items-center gap-2.5 pt-1">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 transition-colors focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-0"
                />
                <span className="text-xs text-slate-600">
                  Remember me for{' '}
                  <span className="font-semibold text-slate-700">30 days</span>
                </span>
              </label>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="group relative mt-2 inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:from-blue-700 hover:to-blue-600 hover:shadow-xl hover:shadow-blue-500/40 focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:shadow-lg"
              >
                {/* Shimmer effect */}
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            {/* Footer note */}
            <div className="mt-6 border-t border-slate-100 pt-5">
              <div className="flex items-center justify-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
                <Shield className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <p className="text-center text-[11px] leading-relaxed text-slate-500">
                  Accounts are issued by the School Administrator.
                  <br />
                  Contact your administrator if you don&apos;t have credentials.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom copyright */}
          <div className="mt-6 text-center">
            <p className="text-[11px] font-medium text-white/70 drop-shadow">
              © 2026 Enrollment Data Analytics and Reporting System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}