import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionAdmin, unauthorized, forbidden, badRequest } from '@/lib/api-helpers';
import { clearDataSchema } from '@/lib/utils/validation';

async function deleteQueryBatched(query: FirebaseFirestore.Query) {
  let totalDeleted = 0;
  const snapshot = await query.get();

  // Process in chunks of 500
  const docs = snapshot.docs;
  for (let i = 0; i < docs.length; i += 500) {
    const chunk = docs.slice(i, i + 500);
    const batch = adminDb.batch();
    chunk.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    totalDeleted += chunk.length;
  }

  return totalDeleted;
}

export async function POST(request: NextRequest) {
  const admin = await getSessionAdmin(request);
  if (!admin) return unauthorized();
  if (admin.role !== 'super_admin') return forbidden();

  try {
    const body = await request.json();
    const parsed = clearDataSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message);
    }

    const { type, formId, institutionId, confirmPhrase } = parsed.data;

    switch (type) {
      case 'form_responses': {
        if (!formId) return badRequest('formId is required');

        const deleted = await deleteQueryBatched(
          adminDb.collection('responses').where('formId', '==', formId)
        );

        // Reset response count
        await adminDb.collection('forms').doc(formId).update({ responseCount: 0 });

        return NextResponse.json({ success: true, deleted });
      }

      case 'otp_sessions': {
        const deleted = await deleteQueryBatched(adminDb.collection('otpSessions'));
        return NextResponse.json({ success: true, deleted });
      }

      case 'institution_students': {
        if (!institutionId) return badRequest('institutionId is required');

        const deleted = await deleteQueryBatched(
          adminDb.collection('students').where('institutionId', '==', institutionId)
        );

        return NextResponse.json({ success: true, deleted });
      }

      case 'full_reset': {
        if (confirmPhrase !== 'DELETE EVERYTHING') {
          return badRequest('You must type "DELETE EVERYTHING" to confirm');
        }

        const collections = ['responses', 'otpSessions', 'students', 'forms'];
        let totalDeleted = 0;

        for (const col of collections) {
          const deleted = await deleteQueryBatched(adminDb.collection(col));
          totalDeleted += deleted;
        }

        return NextResponse.json({ success: true, deleted: totalDeleted });
      }

      default:
        return badRequest('Invalid clear type');
    }
  } catch (error) {
    console.error('Clear data error:', error);
    return NextResponse.json({ error: 'Failed to clear data' }, { status: 500 });
  }
}
