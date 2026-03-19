import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();
    if (!idToken) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const adminDoc = await adminDb.collection('admins').doc(decodedToken.uid).get();

    if (!adminDoc.exists) {
      return NextResponse.json({ error: 'Not authorized as admin' }, { status: 403 });
    }

    const adminData = adminDoc.data();
    if (!adminData?.isActive) {
      return NextResponse.json({ error: 'Account is disabled' }, { status: 403 });
    }

    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    const admin = {
      uid: decodedToken.uid,
      email: adminData.email,
      displayName: adminData.displayName,
      role: adminData.role,
      institutionId: adminData.institutionId,
      isActive: adminData.isActive,
      createdAt: adminData.createdAt,
    };

    const response = NextResponse.json({ success: true, admin });
    response.cookies.set('session', sessionCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return response;
  } catch (error: unknown) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }
}
