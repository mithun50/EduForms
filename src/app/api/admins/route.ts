import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { getSessionAdmin, unauthorized, forbidden, badRequest } from '@/lib/api-helpers';
import { adminSchema } from '@/lib/utils/validation';

export async function GET(request: NextRequest) {
  const admin = await getSessionAdmin(request);
  if (!admin) return unauthorized();

  try {
    let query: FirebaseFirestore.Query = adminDb.collection('admins');

    if (admin.role === 'institution_admin' && admin.institutionId) {
      query = query.where('institutionId', '==', admin.institutionId);
    }

    const snapshot = await query.get();
    const admins = snapshot.docs
      .map((doc) => ({ uid: doc.id, ...doc.data() }))
      .sort((a, b) => {
        const aDate = (a as Record<string, string>).createdAt || '';
        const bDate = (b as Record<string, string>).createdAt || '';
        return bDate.localeCompare(aDate);
      });

    return NextResponse.json({ admins });
  } catch (error) {
    console.error('Get admins error:', error);
    return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const sessionAdmin = await getSessionAdmin(request);
  if (!sessionAdmin) return unauthorized();
  if (sessionAdmin.role !== 'super_admin') return forbidden();

  try {
    const body = await request.json();
    const parsed = adminSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message);
    }

    const { email, password, displayName, role, institutionId } = parsed.data;

    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
    });

    await adminDb.collection('admins').doc(userRecord.uid).set({
      email,
      displayName,
      role,
      institutionId: institutionId || null,
      isActive: true,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ uid: userRecord.uid }, { status: 201 });
  } catch (error: unknown) {
    console.error('Create admin error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to create admin';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
