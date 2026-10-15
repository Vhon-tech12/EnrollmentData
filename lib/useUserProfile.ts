'use client';

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  bio: string;
  department: string;
  employeeId: string;
}

export interface NotificationPrefs {
  newSubmission: boolean;
  pendingReminder: boolean;
  dailySummary: boolean;
  weeklyReport: boolean;
  cancelledEnrollment: boolean;
  emailNotifications: boolean;
  browserNotifications: boolean;
}

export interface EnrollmentPrefs {
  defaultAcademicYear: string;
  defaultProgram: string;
  defaultYearLevel: string;
  defaultStatus: string;
  autoVerify: boolean;
  recordsPerPage: string;
  exportFormat: string;
}

export interface UserPrefs {
  notifications: NotificationPrefs;
  enrollment: EnrollmentPrefs;
}

const DEFAULT_NOTIFICATIONS: NotificationPrefs = {
  newSubmission: true,
  pendingReminder: true,
  dailySummary: true,
  weeklyReport: false,
  cancelledEnrollment: true,
  emailNotifications: true,
  browserNotifications: false,
};

const DEFAULT_ENROLLMENT: EnrollmentPrefs = {
  defaultAcademicYear: '2025-2026',
  defaultProgram: '',
  defaultYearLevel: '',
  defaultStatus: 'Pending',
  autoVerify: false,
  recordsPerPage: '15',
  exportFormat: 'xlsx',
};

export const DEFAULT_PREFS: UserPrefs = {
  notifications: DEFAULT_NOTIFICATIONS,
  enrollment: DEFAULT_ENROLLMENT,
};

export function useUserProfile(uid: string | undefined) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [prefs, setPrefs] = useState<UserPrefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!uid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const ref = doc(db, 'users', uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();
        if (data.profile) setProfile(data.profile);
        if (data.preferences) {
          setPrefs({
            notifications: {
              ...DEFAULT_NOTIFICATIONS,
              ...(data.preferences.notifications ?? {}),
            },
            enrollment: {
              ...DEFAULT_ENROLLMENT,
              ...(data.preferences.enrollment ?? {}),
            },
          });
        }
      }
    } catch (e: any) {
      console.error('Profile load error:', e);
      setError(e?.message ?? 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    load();
  }, [load]);

  const saveProfile = async (data: UserProfile) => {
    if (!uid) throw new Error('Not authenticated');
    const ref = doc(db, 'users', uid);
    await setDoc(ref, { profile: data }, { merge: true });
    setProfile(data);
  };

  const savePrefs = async (data: UserPrefs) => {
    if (!uid) throw new Error('Not authenticated');
    const ref = doc(db, 'users', uid);
    await setDoc(ref, { preferences: data }, { merge: true });
    setPrefs(data);
  };

  return { profile, prefs, loading, error, saveProfile, savePrefs, reload: load };
}