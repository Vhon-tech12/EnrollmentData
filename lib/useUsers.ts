'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export type UserRole = 'admin' | 'registrar' | 'department-head';
export type UserStatus = 'Active' | 'Inactive' | 'Suspended';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleLabel: string;
  department: string;
  status: UserStatus;
  initials: string;
  createdAt?: string;
  lastLogin?: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'School Administrator',
  registrar: 'Registrar / Enrollment Officer',
  'department-head': 'Department Head',
};

export const DEPARTMENTS = [
  "President's Office",
  'Office of the Registrar',
  'College of Computer Studies',
  'College of Business',
  'College of Education',
  'College of Engineering',
];

export function useUsers() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const snap = await getDocs(collection(db, 'users'));
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as AppUser[];

      // Sort: admins first, then by name
      data.sort((a, b) => {
        const order: UserRole[] = ['admin', 'registrar', 'department-head'];
        const aIdx = order.indexOf(a.role);
        const bIdx = order.indexOf(b.role);
        if (aIdx !== bIdx) return aIdx - bIdx;
        return a.name.localeCompare(b.name);
      });

      setUsers(data);
    } catch (e: any) {
      console.error('Users fetch error:', e);
      setError(e?.message ?? 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { users, loading, error, refetch };
}