import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionAdmin, unauthorized, forbidden, badRequest } from '@/lib/api-helpers';
import { institutionSchema } from '@/lib/utils/validation';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await getSessionAdmin(request);
  if (!admin) return unauthorized();

  try {
    const doc = await adminDb.collection('institutions').doc(id).get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (admin.role === 'institution_admin' && admin.institutionId !== id) {
      return forbidden();
    }

    return NextResponse.json({ institution: { id: doc.id, ...doc.data() } });
  } catch (error) {
    console.error('Get institution error:', error);
    return NextResponse.json({ error: 'Failed to fetch institution' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await getSessionAdmin(request);
  if (!admin) return unauthorized();
  if (admin.role !== 'super_admin') return forbidden();

  try {
    const body = await request.json();
    const parsed = institutionSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message);
    }

    await adminDb.collection('institutions').doc(id).update(parsed.data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update institution error:', error);
    return NextResponse.json({ error: 'Failed to update institution' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await getSessionAdmin(request);
  if (!admin) return unauthorized();
  if (admin.role !== 'super_admin') return forbidden();

  try {
    await adminDb.collection('institutions').doc(id).update({ isActive: false });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete institution error:', error);
    return NextResponse.json({ error: 'Failed to delete institution' }, { status: 500 });
  }
}
