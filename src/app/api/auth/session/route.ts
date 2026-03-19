import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    const session = request.cookies.get('session')?.value;
    if (!session) {
      return NextResponse.json({ admin: null }, { status: 401 });
    }

    const decodedClaims = await adminAuth.verifySessionCookie(session, true);
    const adminDoc = await adminDb.collection('admins').doc(decodedClaims.uid).get();

    if (!adminDoc.exists) {
      return NextResponse.json({ admin: null }, { status: 401 });
    }

    const data = adminDoc.data()!;
    return NextResponse.json({
      admin: {
        uid: decodedClaims.uid,
        email: data.email,
        displayName: data.displayName,
        role: data.role,
        institutionId: data.institutionId,
        isActive: data.isActive,
        createdAt: data.createdAt,
      },
    });
  } catch {
    return NextResponse.json({ admin: null }, { status: 401 });
  }
}
