import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { getSessionAdmin, unauthorized, forbidden } from '@/lib/api-helpers';

export async function GET(request: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params;
  const admin = await getSessionAdmin(request);
  if (!admin) return unauthorized();

  try {
    const doc = await adminDb.collection('admins').doc(uid).get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ admin: { uid: doc.id, ...doc.data() } });
  } catch (error) {
    console.error('Get admin error:', error);
    return NextResponse.json({ error: 'Failed to fetch admin' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params;
  const sessionAdmin = await getSessionAdmin(request);
  if (!sessionAdmin) return unauthorized();
  if (sessionAdmin.role !== 'super_admin') return forbidden();

  try {
    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.displayName) updates.displayName = body.displayName;
    if (body.role) updates.role = body.role;
    if (body.institutionId !== undefined) updates.institutionId = body.institutionId;
    if (body.isActive !== undefined) updates.isActive = body.isActive;

    await adminDb.collection('admins').doc(uid).update(updates);

    if (body.displayName) {
      await adminAuth.updateUser(uid, { displayName: body.displayName });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update admin error:', error);
    return NextResponse.json({ error: 'Failed to update admin' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params;
  const sessionAdmin = await getSessionAdmin(request);
  if (!sessionAdmin) return unauthorized();
  if (sessionAdmin.role !== 'super_admin') return forbidden();

  try {
    await adminDb.collection('admins').doc(uid).update({ isActive: false });
    await adminAuth.updateUser(uid, { disabled: true });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete admin error:', error);
    return NextResponse.json({ error: 'Failed to delete admin' }, { status: 500 });
  }
}
