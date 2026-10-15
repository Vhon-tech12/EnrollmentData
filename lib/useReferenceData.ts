'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';

export type ReferenceType =
  | 'academic-years'
  | 'programs'
  | 'year-levels'
  | 'sections'
  | 'statuses';

export interface ReferenceItem {
  id: string;
  type: ReferenceType;
  code: string;
  label: string;
  description?: string;
  order?: number;
  isCurrent?: boolean;
  status: 'Active' | 'Inactive';
}

export const SEED_REFERENCE_DATA: Omit<ReferenceItem, 'id'>[] = [
  { type: 'academic-years', code: '2021-2022', label: 'Academic Year 2021-2022', status: 'Inactive', isCurrent: false },
  { type: 'academic-years', code: '2022-2023', label: 'Academic Year 2022-2023', status: 'Inactive', isCurrent: false },
  { type: 'academic-years', code: '2023-2024', label: 'Academic Year 2023-2024', status: 'Inactive', isCurrent: false },
  { type: 'academic-years', code: '2024-2025', label: 'Academic Year 2024-2025', status: 'Active', isCurrent: false },
  { type: 'academic-years', code: '2025-2026', label: 'Academic Year 2025-2026', status: 'Active', isCurrent: true },
  { type: 'programs', code: 'BSIT', label: 'BS Information Technology', description: 'College of Computer Studies', status: 'Active' },
  { type: 'programs', code: 'BSCS', label: 'BS Computer Science', description: 'College of Computer Studies', status: 'Active' },
  { type: 'programs', code: 'BSBA', label: 'BS Business Administration', description: 'College of Business', status: 'Active' },
  { type: 'programs', code: 'BSA', label: 'BS Accountancy', description: 'College of Business', status: 'Active' },
  { type: 'programs', code: 'BSED', label: 'BS Education', description: 'College of Education', status: 'Active' },
  { type: 'year-levels', code: '1', label: '1st Year', order: 1, status: 'Active' },
  { type: 'year-levels', code: '2', label: '2nd Year', order: 2, status: 'Active' },
  { type: 'year-levels', code: '3', label: '3rd Year', order: 3, status: 'Active' },
  { type: 'year-levels', code: '4', label: '4th Year', order: 4, status: 'Active' },
  { type: 'sections', code: 'A', label: 'Section A', status: 'Active' },
  { type: 'sections', code: 'B', label: 'Section B', status: 'Active' },
  { type: 'sections', code: 'C', label: 'Section C', status: 'Active' },
  { type: 'sections', code: 'D', label: 'Section D', status: 'Active' },
  { type: 'sections', code: 'E', label: 'Section E', status: 'Active' },
  { type: 'statuses', code: 'ENROLLED', label: 'Enrolled', status: 'Active' },
  { type: 'statuses', code: 'PENDING', label: 'Pending', status: 'Active' },
  { type: 'statuses', code: 'CANCELLED', label: 'Cancelled', status: 'Active' },
];

export function useReferenceData() {
  const [items, setItems] = useState<ReferenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const snap = await getDocs(collection(db, 'reference_data'));
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as ReferenceItem[];
      setItems(data);
    } catch (e: any) {
      console.error('Reference data fetch error:', e);
      setError(e?.message ?? 'Failed to load reference data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const seed = async () => {
    const batch = writeBatch(db);
    const col = collection(db, 'reference_data');
    SEED_REFERENCE_DATA.forEach((item) => {
      const newDoc = doc(col);
      batch.set(newDoc, item);
    });
    await batch.commit();
    await refetch();
  };

  const addItem = async (item: Omit<ReferenceItem, 'id'>) => {
    await addDoc(collection(db, 'reference_data'), item);
    await refetch();
  };

  const updateItem = async (id: string, updates: Partial<ReferenceItem>) => {
    const { id: _ignore, ...rest } = updates as any;
    await updateDoc(doc(db, 'reference_data', id), rest);
    await refetch();
  };

  const deleteItem = async (id: string) => {
    await deleteDoc(doc(db, 'reference_data', id));
    await refetch();
  };

  return {
    items,
    loading,
    error,
    refetch,
    seed,
    addItem,
    updateItem,
    deleteItem,
  };
}