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
    if (form.createdBy !== admin.uid) return forbidden();

    if (form.accessType !== 'restricted') {
      return NextResponse.json(
        { error: 'Non-responder tracking is only available for restricted forms' },
        { status: 400 }
      );
    }

    // Get all students from the institution
    const studentSnapshot = await adminDb
      .collection('students')
      .where('institutionId', '==', form.institutionId)
      .get();

    let eligible = studentSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Array<Record<string, string> & { id: string }>;

    // Apply restriction filters
    const allowedSections = form.settings?.allowedSections || [];
    const allowedYears = form.settings?.allowedYears || [];
    const allowedDepartments = form.settings?.allowedDepartments || [];

    if (allowedSections.length > 0) {
      eligible = eligible.filter((s) => allowedSections.includes(s.section || ''));
    }
    if (allowedYears.length > 0) {
      eligible = eligible.filter((s) => allowedYears.includes(s.year || ''));
    }
    if (allowedDepartments.length > 0) {
      eligible = eligible.filter((s) => allowedDepartments.includes(s.department || ''));
    }

    // Check target audience if set
    const targetAudience = form.settings?.targetAudience;
    if (targetAudience?.mode === 'upload' && targetAudience.studentIds?.length > 0) {
      eligible = eligible.filter((s) => targetAudience.studentIds.includes(s.id));
    }

    // Get existing responses
    const responseSnapshot = await adminDb
      .collection('responses')
      .where('formId', '==', formId)
      .get();

    const respondedIdentifiers = new Set(
      responseSnapshot.docs.map((d) => d.data().respondentIdentifier)
    );

    // Filter to non-responders
    const nonResponders = eligible.filter((s) => !respondedIdentifiers.has(s.rollNumber));

    return NextResponse.json({
      nonResponders,
      totalEligible: eligible.length,
      totalResponded: respondedIdentifiers.size,
      totalNonResponders: nonResponders.length,
    });
  } catch (error) {
    console.error('Non-responders error:', error);
    return NextResponse.json({ error: 'Failed to fetch non-responders' }, { status: 500 });
  }
}
