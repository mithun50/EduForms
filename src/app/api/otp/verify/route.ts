import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { otpVerifySchema } from '@/lib/utils/validation';
import { verifyOtp } from '@/lib/utils/otp';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = otpVerifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { sessionId, otp } = parsed.data;

    const sessionRef = adminDb.collection('otpSessions').doc(sessionId);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 400 });
    }

    const session = sessionDoc.data()!;

    if (session.verified) {
      return NextResponse.json({ error: 'OTP already verified' }, { status: 400 });
    }

    if (new Date() > new Date(session.expiresAt)) {
      return NextResponse.json({ error: 'OTP has expired. Request a new one.' }, { status: 400 });
    }

    if (session.attempts >= 5) {
      return NextResponse.json(
        { error: 'Too many attempts. Request a new OTP.' },
        { status: 429 }
      );
    }

    // Increment attempts
    await sessionRef.update({ attempts: session.attempts + 1 });

    const isValid = await verifyOtp(otp, session.otpHash);
    if (!isValid) {
      const remaining = 4 - session.attempts;
      return NextResponse.json(
        { error: `Invalid OTP. ${remaining} attempt(s) remaining.` },
        { status: 400 }
      );
    }

    await sessionRef.update({ verified: true });

    // Check for existing response to enable editing
    const existingResponseQuery = await adminDb
      .collection('responses')
      .where('formId', '==', session.formId)
      .where('respondentIdentifier', '==', session.identifier)
      .limit(1)
      .get();

    let existingAnswers: Record<string, unknown> | null = null;
    if (!existingResponseQuery.empty) {
      existingAnswers = existingResponseQuery.docs[0].data().answers;
    }

    return NextResponse.json({
      success: true,
      formId: session.formId,
      identifier: session.identifier,
      email: session.email,
      existingAnswers,
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
  }
}
