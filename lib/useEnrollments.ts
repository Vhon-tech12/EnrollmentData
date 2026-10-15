'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export interface EnrollmentRecord {
  id: string;
  studentId: string;
  studentName: string;
  email: string;
  program: string;
  yearLevel: string;
  section: string;
  academicYear: string;
  status: 'Enrolled' | 'Pending' | 'Cancelled';
  dateEnrolled: string;
}

export function useEnrollments() {
  const [records, setRecords] = useState<EnrollmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const snap = await getDocs(collection(db, 'enrollments'));
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as EnrollmentRecord[];
      setRecords(data);
    } catch (e: any) {
      console.error('Firestore fetch error:', e);
      setError(e?.message ?? 'Failed to load enrollment records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { records, loading, error, refetch };
}