import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionAdmin, unauthorized, forbidden } from '@/lib/api-helpers';

export async function GET(request: NextRequest, { params }: { params: Promise<{ formId: string }> }) {
  const { formId } = await params;
  const admin = await getSessionAdmin(request);
  if (!admin) return unauthorized();

  try {
    const formDoc = await adminDb.collection('forms').doc(formId).get();
    if (!formDoc.exists) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    const form = formDoc.data()!;
    // Only the form creator can view its responses
    if (form.createdBy !== admin.uid) {
      return forbidden();
    }

    const snapshot = await adminDb
      .collection('responses')
      .where('formId', '==', formId)
      .get();

    const responses = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => {
        const aDate = (a as Record<string, string>).submittedAt || '';
        const bDate = (b as Record<string, string>).submittedAt || '';
        return bDate.localeCompare(aDate);
      });

    // For restricted forms, look up student details
    let studentMap: Record<string, { name: string; department: string; year: string; section: string }> = {};
    if (form.accessType === 'restricted' && responses.length > 0) {
      const identifiers = [...new Set(responses.map((r) => (r as Record<string, string>).respondentIdentifier))];
      // Fetch students in batches of 30 (Firestore 'in' limit)
      for (let i = 0; i < identifiers.length; i += 30) {
        const batch = identifiers.slice(i, i + 30);
        const studentSnapshot = await adminDb
          .collection('students')
          .where('rollNumber', 'in', batch)
          .where('institutionId', '==', form.institutionId)
          .get();
        studentSnapshot.docs.forEach((doc) => {
          const s = doc.data();
          studentMap[s.rollNumber] = {
            name: s.name || '',
            department: s.department || '',
            year: s.year || '',
            section: s.section || '',
          };
        });
      }
    }

    return NextResponse.json({ responses, studentMap });
  } catch (error) {
    console.error('Get responses error:', error);
    return NextResponse.json({ error: 'Failed to fetch responses' }, { status: 500 });
  }
}
