import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionAdmin, unauthorized, forbidden } from '@/lib/api-helpers';
import { generateSlug } from '@/lib/utils/slug';

export async function POST(request: NextRequest, { params }: { params: Promise<{ formId: string }> }) {
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

    const newTitle = `Copy of ${form.title}`;
    const slug = generateSlug(newTitle);

    const newFormRef = await adminDb.collection('forms').add({
      institutionId: form.institutionId,
      createdBy: admin.uid,
      title: newTitle,
      description: form.description || '',
      status: 'draft',
      accessType: form.accessType,
      settings: form.settings || {
        startDate: null,
        endDate: null,
        responseLimit: null,
        confirmationMessage: 'Thank you for your response!',
      },
      responseCount: 0,
      slug,
      createdAt: new Date().toISOString(),
    });

    // Copy fields
    const fieldsSnapshot = await adminDb
      .collection('forms')
      .doc(formId)
      .collection('fields')
      .orderBy('order')
      .get();

    const batch = adminDb.batch();
    fieldsSnapshot.docs.forEach((fieldDoc) => {
      const fieldData = fieldDoc.data();
      const newFieldRef = newFormRef.collection('fields').doc();
      batch.set(newFieldRef, fieldData);
    });
    await batch.commit();

    return NextResponse.json({ id: newFormRef.id, slug }, { status: 201 });
  } catch (error) {
    console.error('Duplicate form error:', error);
    return NextResponse.json({ error: 'Failed to duplicate form' }, { status: 500 });
  }
}
