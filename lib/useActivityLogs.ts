'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from './firebase';

export type ActivityModule =
  | 'Authentication'
  | 'Enrollment'
  | 'User Management'
  | 'Reference Data'
  | 'Reports'
  | 'Analytics'
  | 'Settings';

export type ActivityStatus = 'Success' | 'Warning' | 'Failed';

export interface ActivityLog {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  activity: string;
  module: ActivityModule;
  status: ActivityStatus;
}

export function useActivityLogs(maxRecords = 200) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = query(
        collection(db, 'activity_logs'),
        orderBy('timestamp', 'desc'),
        limit(maxRecords),
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as ActivityLog[];
      setLogs(data);
    } catch (e: any) {
      console.error('Activity logs fetch error:', e);
      setError(e?.message ?? 'Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  }, [maxRecords]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { logs, loading, error, refetch };
}