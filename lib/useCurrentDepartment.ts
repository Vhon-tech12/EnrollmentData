'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getDepartmentConfig, type DepartmentConfig } from './departments';

export function useCurrentDepartment() {
  const [department, setDepartment] = useState<DepartmentConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setDepartment(getDepartmentConfig(data.department as string));
        } else {
          // Fallback — walang Firestore doc
          setDepartment(getDepartmentConfig(undefined));
        }
      } catch (e) {
        console.warn('Failed to load department:', e);
        setDepartment(getDepartmentConfig(undefined));
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  return { department, loading };
}