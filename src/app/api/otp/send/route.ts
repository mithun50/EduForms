import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { otpSendSchema } from '@/lib/utils/validation';
import { generateOtp, hashOtp } from '@/lib/utils/otp';
import { sendOtpEmail } from '@/lib/brevo/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = otpSendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { formId, identifier } = parsed.data;

    // Get form details
    const formDoc = await adminDb.collection('forms').doc(formId).get();
    if (!formDoc.exists) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    const form = formDoc.data()!;
    if (form.status !== 'published') {
      return NextResponse.json({ error: 'Form is not accepting responses' }, { status: 400 });
    }

    // Check date range
    if (form.settings.startDate && new Date() < new Date(form.settings.startDate)) {
      return NextResponse.json({ error: 'Form has not started yet' }, { status: 400 });
    }
    if (form.settings.endDate && new Date() > new Date(form.settings.endDate)) {
      return NextResponse.json({ error: 'Form has ended' }, { status: 400 });
    }

    let email: string;

    if (form.accessType === 'restricted') {
      // Look up student by roll number in institution
      const studentQuery = await adminDb
        .collection('students')
        .where('rollNumber', '==', identifier)
        .get();

      const student = studentQuery.docs.find(
        (doc) => doc.data().institutionId === form.institutionId
      );

      if (!student) {
        return NextResponse.json(
          { error: 'Student not found. Contact your institution admin.' },
          { status: 404 }
        );
      }

      email = student.data().email;

      // Check section restriction
      const allowedSections = form.settings?.allowedSections || [];
      if (allowedSections.length > 0) {
        const studentSection = student.data().section || '';
        if (!allowedSections.includes(studentSection)) {
          return NextResponse.json(
            { error: `This form is restricted to section(s): ${allowedSections.join(', ')}` },
            { status: 403 }
          );
        }
      }

      // Check year restriction
      const allowedYears = form.settings?.allowedYears || [];
      if (allowedYears.length > 0) {
        const studentYear = student.data().year || '';
        if (!allowedYears.includes(studentYear)) {
          return NextResponse.json(
            { error: `This form is restricted to year(s): ${allowedYears.join(', ')}` },
            { status: 403 }
          );
        }
      }

      // Check department restriction
      const allowedDepartments = form.settings?.allowedDepartments || [];
      if (allowedDepartments.length > 0) {
        const studentDept = student.data().department || '';
        if (!allowedDepartments.includes(studentDept)) {
          return NextResponse.json(
            { error: `This form is restricted to department(s): ${allowedDepartments.join(', ')}` },
            { status: 403 }
          );
        }
      }

      // Check target audience (uploaded student list)
      const targetAudience = form.settings?.targetAudience;
      if (targetAudience?.mode === 'upload' && targetAudience.studentIds?.length > 0) {
        if (!targetAudience.studentIds.includes(student.id)) {
          return NextResponse.json(
            { error: 'You are not in the target audience for this form' },
            { status: 403 }
          );
        }
      }
    } else {
      // Public form - identifier is email
      email = identifier;
    }

    // Check response limit (allow existing respondents to edit)
    if (form.settings.responseLimit && form.responseCount >= form.settings.responseLimit) {
      const existingResponse = await adminDb
        .collection('responses')
        .where('formId', '==', formId)
        .where('respondentIdentifier', '==', identifier)
        .limit(1)
        .get();

      if (existingResponse.empty) {
        return NextResponse.json({ error: 'Form has reached response limit' }, { status: 400 });
      }
    }

    // Rate limit: max 3 OTPs per email per 15 minutes
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const recentOtps = await adminDb
      .collection('otpSessions')
      .where('email', '==', email)
      .get();

    const recentCount = recentOtps.docs.filter(
      (doc) => (doc.data().createdAt || '') >= fifteenMinAgo
    ).length;

    if (recentCount >= 3) {
      return NextResponse.json(
        { error: 'Too many OTP requests. Try again in 15 minutes.' },
        { status: 429 }
      );
    }

    // Generate and send OTP
    const otp = generateOtp();
    const otpHash = await hashOtp(otp);

    const sessionRef = await adminDb.collection('otpSessions').add({
      formId,
      identifier,
      email,
      otpHash,
      attempts: 0,
      verified: false,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    });

    await sendOtpEmail(email, otp, form.title);

    // Mask email for response
    const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3');

    return NextResponse.json({
      sessionId: sessionRef.id,
      maskedEmail,
      message: 'OTP sent successfully',
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
