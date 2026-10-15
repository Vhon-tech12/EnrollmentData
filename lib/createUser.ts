'use client';

import {
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { getSecondaryAuth, db } from './firebase';
import { ROLE_LABELS, type UserRole, type UserStatus } from './useUsers';

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department: string;
  status: UserStatus;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');
}

export async function createAppUser(input: CreateUserInput): Promise<string> {
  // 1. Create user sa secondary app (para hindi ma-logout si admin)
  const secondaryAuth = getSecondaryAuth();

  const cred = await createUserWithEmailAndPassword(
    secondaryAuth,
    input.email.trim(),
    input.password,
  );

  const uid = cred.user.uid;

  // 2. Set display name
  await updateProfile(cred.user, { displayName: input.name });

  // 3. Save metadata sa Firestore
  await setDoc(doc(db, 'users', uid), {
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    role: input.role,
    roleLabel: ROLE_LABELS[input.role],
    department: input.department,
    status: input.status,
    initials: getInitials(input.name),
    createdAt: new Date().toISOString(),
    lastLogin: 'Never logged in',
  });

  // 4. Sign out from secondary app (admin session stays intact)
  await signOut(secondaryAuth);

  return uid;
}