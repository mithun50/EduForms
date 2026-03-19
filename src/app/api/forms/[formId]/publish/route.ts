import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionAdmin, unauthorized, forbidden } from '@/lib/api-helpers';

export async function POST(request: NextRequest, { params }: { params: Promise<{ formId: string }> }) {
  const { formId } = await params;
  const admin = await getSessionAdmin(request);
  if (!admin) return unauthorized();

  try {
    const formDoc = await adminDb.collection('forms').doc(formId).get();
    if (!formDoc.exists) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    const form = formDoc.data()!;
    if (admin.role === 'institution_admin' && admin.institutionId !== form.institutionId) {
      return forbidden();
    }

    // Check if form has fields
    const fieldsSnapshot = await adminDb
      .collection('forms')
      .doc(formId)
      .collection('fields')
      .get();

    if (fieldsSnapshot.empty) {
      return NextResponse.json({ error: 'Cannot publish a form without fields' }, { status: 400 });
    }

    await adminDb.collection('forms').doc(formId).update({ status: 'published' });
    return NextResponse.json({ success: true, slug: form.slug });
  } catch (error) {
    console.error('Publish form error:', error);
    return NextResponse.json({ error: 'Failed to publish form' }, { status: 500 });
  }
}
