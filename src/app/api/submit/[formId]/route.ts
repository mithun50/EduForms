import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest, { params }: { params: Promise<{ formId: string }> }) {
  const { formId } = await params;
  try {
    const body = await request.json();
    const { sessionId, answers } = body;

    if (!sessionId || !answers) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify OTP session
    const sessionDoc = await adminDb.collection('otpSessions').doc(sessionId).get();
    if (!sessionDoc.exists) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 400 });
    }

    const session = sessionDoc.data()!;
    if (!session.verified) {
      return NextResponse.json({ error: 'OTP not verified' }, { status: 400 });
    }

    if (session.formId !== formId) {
      return NextResponse.json({ error: 'Session/form mismatch' }, { status: 400 });
    }

    // Get form
    const formDoc = await adminDb.collection('forms').doc(formId).get();
    if (!formDoc.exists) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    const form = formDoc.data()!;
    if (form.status !== 'published') {
      return NextResponse.json({ error: 'Form is not accepting responses' }, { status: 400 });
    }

    const responseId = await adminDb.runTransaction(async (transaction) => {
      // Check for existing response by this respondent
      const existingQuery = await adminDb
        .collection('responses')
        .where('formId', '==', formId)
        .where('respondentIdentifier', '==', session.identifier)
        .limit(1)
        .get();

      const existingDoc = existingQuery.docs[0] || null;

      // Validate required fields
      const fieldsSnapshot = await adminDb
        .collection('forms')
        .doc(formId)
        .collection('fields')
        .get();

      for (const fieldDoc of fieldsSnapshot.docs) {
        const field = fieldDoc.data();
        if (field.required && (!answers[fieldDoc.id] || !answers[fieldDoc.id].value)) {
          throw new Error(`VALIDATION:${field.label} is required`);
        }
      }

      if (existingDoc) {
        // Update existing response
        transaction.update(existingDoc.ref, {
          answers,
          submittedAt: new Date().toISOString(),
        });
        return existingDoc.id;
      } else {
        // Create new response
        const responseRef = adminDb.collection('responses').doc();
        transaction.set(responseRef, {
          formId: formId,
          institutionId: form.institutionId,
          respondentType: form.accessType === 'restricted' ? 'student' : 'public',
          respondentIdentifier: session.identifier,
          respondentEmail: session.email,
          answers,
          submittedAt: new Date().toISOString(),
        });

        // Only increment response count for new submissions
        transaction.update(adminDb.collection('forms').doc(formId), {
          responseCount: FieldValue.increment(1),
        });

        return responseRef.id;
      }
    });

    return NextResponse.json({
      success: true,
      responseId,
      message: form.settings.confirmationMessage || 'Thank you for your response!',
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.startsWith('VALIDATION:')) {
        return NextResponse.json({ error: error.message.replace('VALIDATION:', '') }, { status: 400 });
      }
    }
    console.error('Submit form error:', error);
    return NextResponse.json({ error: 'Failed to submit form' }, { status: 500 });
  }
}
