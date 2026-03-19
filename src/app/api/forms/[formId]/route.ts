import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionAdmin, unauthorized, forbidden } from '@/lib/api-helpers';

export async function GET(request: NextRequest, { params }: { params: Promise<{ formId: string }> }) {
  const { formId } = await params;
  const admin = await getSessionAdmin(request);
  if (!admin) return unauthorized();

  try {
    const doc = await adminDb.collection('forms').doc(formId).get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const form = doc.data()!;
    if (form.createdBy !== admin.uid) {
      return forbidden();
    }

    // Also fetch fields
    const fieldsSnapshot = await adminDb
      .collection('forms')
      .doc(formId)
      .collection('fields')
      .orderBy('order')
      .get();

    const fields = fieldsSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    return NextResponse.json({ form: { id: doc.id, ...form }, fields });
  } catch (error) {
    console.error('Get form error:', error);
    return NextResponse.json({ error: 'Failed to fetch form' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ formId: string }> }) {
  const { formId } = await params;
  const admin = await getSessionAdmin(request);
  if (!admin) return unauthorized();

  try {
    const body = await request.json();
    const doc = await adminDb.collection('forms').doc(formId).get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const form = doc.data()!;
    if (form.createdBy !== admin.uid) {
      return forbidden();
    }

    const updates: Record<string, unknown> = {};
    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.accessType !== undefined) updates.accessType = body.accessType;
    if (body.settings !== undefined) updates.settings = body.settings;
    if (body.status !== undefined) updates.status = body.status;

    await adminDb.collection('forms').doc(formId).update(updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update form error:', error);
    return NextResponse.json({ error: 'Failed to update form' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ formId: string }> }) {
  const { formId } = await params;
  const admin = await getSessionAdmin(request);
  if (!admin) return unauthorized();

  try {
    const doc = await adminDb.collection('forms').doc(formId).get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const form = doc.data()!;
    if (form.createdBy !== admin.uid) {
      return forbidden();
    }

    await adminDb.collection('forms').doc(formId).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete form error:', error);
    return NextResponse.json({ error: 'Failed to delete form' }, { status: 500 });
  }
}
