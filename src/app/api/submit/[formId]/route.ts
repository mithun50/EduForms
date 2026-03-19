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

    // Duplicate check using transaction
    const responseId = await adminDb.runTransaction(async (transaction) => {
      // Check for existing response
      const existingQuery = await adminDb
        .collection('responses')
        .where('formId', '==', formId)
        .get();

      const duplicate = existingQuery.docs.some(
        (doc) => doc.data().respondentIdentifier === session.identifier
      );

      if (duplicate) {
        throw new Error('DUPLICATE');
      }

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

      // Increment response count
      transaction.update(adminDb.collection('forms').doc(formId), {
        responseCount: FieldValue.increment(1),
      });

      return responseRef.id;
    });

    return NextResponse.json({
      success: true,
      responseId,
      message: form.settings.confirmationMessage || 'Thank you for your response!',
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === 'DUPLICATE') {
        return NextResponse.json({ error: 'You have already submitted this form' }, { status: 400 });
      }
      if (error.message.startsWith('VALIDATION:')) {
        return NextResponse.json({ error: error.message.replace('VALIDATION:', '') }, { status: 400 });
      }
    }
    console.error('Submit form error:', error);
    return NextResponse.json({ error: 'Failed to submit form' }, { status: 500 });
  }
}
