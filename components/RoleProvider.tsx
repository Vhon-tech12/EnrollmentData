'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';

export type RoleId = 'admin' | 'registrar' | 'school-admin' | 'department-head';

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: RoleId;
  roleLabel: string;
  initials: string;
}

const ROLE_LABELS: Record<RoleId, string> = {
  admin: 'School Administrator',
  registrar: 'Registrar / Enrollment Officer',
  'school-admin': 'School Administrator',
  'department-head': 'Department Head',
};

// Fallback users (kung sakaling walang session cookie — for safety lang)
const FALLBACK_USERS: Record<RoleId, DemoUser> = {
  admin: {
    id: 'fallback-admin',
    name: 'Administrator',
    email: 'admin@school.edu',
    role: 'admin',
    roleLabel: 'School Administrator',
    initials: 'AD',
  },
  registrar: {
    id: 'fallback-registrar',
    name: 'Registrar',
    email: 'registrar@school.edu',
    role: 'registrar',
    roleLabel: 'Registrar / Enrollment Officer',
    initials: 'RE',
  },
  'school-admin': {
    id: 'fallback-school-admin',
    name: 'School Administrator',
    email: 'schooladmin@school.edu',
    role: 'school-admin',
    roleLabel: 'School Administrator',
    initials: 'SA',
  },
  'department-head': {
    id: 'fallback-dept-head',
    name: 'Department Head',
    email: 'departmenthead@school.edu',
    role: 'department-head',
    roleLabel: 'Department Head',
    initials: 'DH',
  },
};

function roleFromPath(pathname: string): RoleId {
  if (pathname.startsWith('/registrar')) return 'registrar';
  if (pathname.startsWith('/school-admin')) return 'school-admin';
  if (pathname.startsWith('/department-head')) return 'department-head';
  return 'admin';
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');
}

// Read the session cookie set during login
function readSessionCookie(): { name: string; email: string; role: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const cookies = document.cookie.split('; ');
    const sessionCookie = cookies.find((c) => c.startsWith('auth-session='));
    if (!sessionCookie) return null;
    const value = decodeURIComponent(sessionCookie.substring('auth-session='.length));
    return JSON.parse(value);
  } catch {
    return null;
  }
}

interface RoleContextValue {
  user: DemoUser;
  role: RoleId;
  demoUsers: DemoUser[];
}

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [sessionData, setSessionData] = useState<{
    name: string;
    email: string;
    role: string;
  } | null>(null);

  // Read the session cookie on mount
  useEffect(() => {
    setSessionData(readSessionCookie());
    setMounted(true);

    // Re-read on focus (in case of login in another tab)
    const handleFocus = () => setSessionData(readSessionCookie());
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Derive role from URL (still the source of truth for routing)
  const role = roleFromPath(pathname);

  // Build the user object from session cookie if available, else fallback
  const user: DemoUser = (() => {
    if (sessionData && sessionData.name && sessionData.role === role) {
      return {
        id: sessionData.email, // use email as id
        name: sessionData.name,
        email: sessionData.email,
        role: role,
        roleLabel: ROLE_LABELS[role],
        initials: getInitials(sessionData.name),
      };
    }
    return FALLBACK_USERS[role];
  })();

  // If we haven't mounted yet (SSR), use fallback to avoid hydration mismatch
  const finalUser = mounted ? user : FALLBACK_USERS[role];

  return (
    <RoleContext.Provider
      value={{
        user: finalUser,
        role,
        demoUsers: [finalUser],
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole(): RoleContextValue {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used within RoleProvider');
  return ctx;
}