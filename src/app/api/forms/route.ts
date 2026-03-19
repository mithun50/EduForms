import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionAdmin, unauthorized, badRequest } from '@/lib/api-helpers';
import { formSchema } from '@/lib/utils/validation';
import { generateSlug } from '@/lib/utils/slug';

export async function GET(request: NextRequest) {
  const admin = await getSessionAdmin(request);
  if (!admin) return unauthorized();

  try {
    // Each admin only sees forms they personally created
    const snapshot = await adminDb
      .collection('forms')
      .where('createdBy', '==', admin.uid)
      .get();

    const forms = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => {
        const aDate = (a as Record<string, string>).createdAt || '';
        const bDate = (b as Record<string, string>).createdAt || '';
        return bDate.localeCompare(aDate);
      });

    return NextResponse.json({ forms });
  } catch (error) {
    console.error('Get forms error:', error);
    return NextResponse.json({ error: 'Failed to fetch forms' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await getSessionAdmin(request);
  if (!admin) return unauthorized();

  try {
    const body = await request.json();
    const parsed = formSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message);
    }

    const { title, description, accessType, settings } = parsed.data;
    // institution_admin: always use their own institutionId (ignore body)
    const institutionId = admin.role === 'institution_admin'
      ? admin.institutionId
      : (body.institutionId || admin.institutionId);

    if (!institutionId) {
      return badRequest('Institution ID is required');
    }

    const slug = generateSlug(title);

    const docRef = await adminDb.collection('forms').add({
      institutionId,
      createdBy: admin.uid,
      title,
      description,
      status: 'draft',
      accessType,
      settings: {
        startDate: settings?.startDate || null,
        endDate: settings?.endDate || null,
        responseLimit: settings?.responseLimit || null,
        confirmationMessage: settings?.confirmationMessage || 'Thank you for your response!',
      },
      responseCount: 0,
      slug,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ id: docRef.id, slug }, { status: 201 });
  } catch (error) {
    console.error('Create form error:', error);
    return NextResponse.json({ error: 'Failed to create form' }, { status: 500 });
  }
}
