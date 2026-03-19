import { signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from './config';
import type { Admin } from '@/types';

export async function signIn(email: string, password: string): Promise<Admin> {
  const result = await signInWithEmailAndPassword(auth, email, password);
  const idToken = await result.user.getIdToken();

  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    const data = await response.json();
    // Sign out of Firebase since server session failed
    await firebaseSignOut(auth);
    throw new Error(data.error || 'Failed to create session');
  }

  const data = await response.json();
  return data.admin;
}

export async function signOut() {
  try {
    await firebaseSignOut(auth);
  } catch {
    // continue even if Firebase sign-out fails
  }
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch {
    // continue even if server logout fails
  }
}
