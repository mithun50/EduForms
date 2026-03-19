import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionAdmin, unauthorized, forbidden, badRequest } from '@/lib/api-helpers';
import { institutionSchema } from '@/lib/utils/validation';

export async function GET(request: NextRequest) {
  const admin = await getSessionAdmin(request);
  if (!admin) return unauthorized();

  try {
    let query: FirebaseFirestore.Query = adminDb.collection('institutions');

    if (admin.role === 'institution_admin' && admin.institutionId) {
      const doc = await adminDb.collection('institutions').doc(admin.institutionId).get();
      if (!doc.exists) return NextResponse.json({ institutions: [] });
      return NextResponse.json({ institutions: [{ id: doc.id, ...doc.data() }] });
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();
    const institutions = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ institutions });
  } catch (error) {
    console.error('Get institutions error:', error);
    return NextResponse.json({ error: 'Failed to fetch institutions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await getSessionAdmin(request);
  if (!admin) return unauthorized();
  if (admin.role !== 'super_admin') return forbidden();

  try {
    const body = await request.json();
    const parsed = institutionSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message);
    }

    const data = parsed.data;
    const docRef = await adminDb.collection('institutions').add({
      ...data,
      logoUrl: '',
      isActive: true,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ id: docRef.id }, { status: 201 });
  } catch (error) {
    console.error('Create institution error:', error);
    return NextResponse.json({ error: 'Failed to create institution' }, { status: 500 });
  }
}
