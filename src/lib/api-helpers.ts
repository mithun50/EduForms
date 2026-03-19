import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import type { Admin } from '@/types';

export async function getSessionAdmin(request: NextRequest): Promise<Admin | null> {
  try {
    const session = request.cookies.get('session')?.value;
    if (!session) return null;

    const decodedClaims = await adminAuth.verifySessionCookie(session, true);
    const adminDoc = await adminDb.collection('admins').doc(decodedClaims.uid).get();

    if (!adminDoc.exists) return null;
    const data = adminDoc.data()!;

    return {
      uid: decodedClaims.uid,
      email: data.email,
      displayName: data.displayName,
      role: data.role,
      institutionId: data.institutionId || null,
      isActive: data.isActive,
      createdAt: data.createdAt,
    };
  } catch {
    return null;
  }
}

export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}
