import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionAdmin, unauthorized, forbidden } from '@/lib/api-helpers';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ formId: string }> }) {
  const { formId } = await params;
  const admin = await getSessionAdmin(request);
  if (!admin) return unauthorized();

  try {
    const formDoc = await adminDb.collection('forms').doc(formId).get();
    if (!formDoc.exists) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    const form = formDoc.data()!;
    if (form.createdBy !== admin.uid) {
      return forbidden();
    }

    const { fields } = await request.json();
    if (!Array.isArray(fields)) {
      return NextResponse.json({ error: 'Fields must be an array' }, { status: 400 });
    }

    const batch = adminDb.batch();
    const fieldsRef = adminDb.collection('forms').doc(formId).collection('fields');

    // Delete existing fields
    const existingFields = await fieldsRef.get();
    existingFields.docs.forEach((doc) => batch.delete(doc.ref));

    // Add new fields
    fields.forEach((field: Record<string, unknown>, index: number) => {
      const fieldRef = field.id ? fieldsRef.doc(field.id as string) : fieldsRef.doc();
      batch.set(fieldRef, {
        type: field.type,
        label: field.label || '',
        description: field.description || '',
        required: field.required || false,
        order: index,
        validation: field.validation || {},
        options: field.options || [],
        scaleConfig: field.scaleConfig || null,
        ratingConfig: field.ratingConfig || null,
      });
    });

    await batch.commit();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update fields error:', error);
    return NextResponse.json({ error: 'Failed to update fields' }, { status: 500 });
  }
}
