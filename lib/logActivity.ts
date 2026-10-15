'use client';

import { addDoc, collection } from 'firebase/firestore';
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

export interface LogActivityInput {
  user: string;
  role: string;
  activity: string;
  module: ActivityModule;
  status?: ActivityStatus;
}

export async function logActivity({
  user,
  role,
  activity,
  module,
  status = 'Success',
}: LogActivityInput): Promise<void> {
  try {
    await addDoc(collection(db, 'activity_logs'), {
      timestamp: new Date().toISOString(),
      user,
      role,
      activity,
      module,
      status,
    });
  } catch (e) {
    console.warn('logActivity failed:', e);
  }
}