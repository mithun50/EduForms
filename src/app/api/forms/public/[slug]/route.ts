import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const snapshot = await adminDb
      .collection('forms')
      .where('slug', '==', slug)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    const formDoc = snapshot.docs[0];
    const form = formDoc.data();

    if (form.status !== 'published') {
      return NextResponse.json({ error: 'Form is not available' }, { status: 400 });
    }

    // Check date range
    if (form.settings.startDate && new Date() < new Date(form.settings.startDate)) {
      return NextResponse.json({ error: 'Form has not started yet' }, { status: 400 });
    }
    if (form.settings.endDate && new Date() > new Date(form.settings.endDate)) {
      return NextResponse.json({ error: 'Form has ended' }, { status: 400 });
    }

    // Get fields
    const fieldsSnapshot = await adminDb
      .collection('forms')
      .doc(formDoc.id)
      .collection('fields')
      .orderBy('order')
      .get();

    const fields = fieldsSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Get institution name
    const instDoc = await adminDb.collection('institutions').doc(form.institutionId).get();
    const institutionName = instDoc.exists ? instDoc.data()?.name : '';

    return NextResponse.json({
      form: {
        id: formDoc.id,
        title: form.title,
        description: form.description,
        accessType: form.accessType,
        settings: form.settings,
        institutionId: form.institutionId,
      },
      fields,
      institutionName,
    });
  } catch (error) {
    console.error('Get public form error:', error);
    return NextResponse.json({ error: 'Failed to fetch form' }, { status: 500 });
  }
}
