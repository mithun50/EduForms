import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionAdmin, unauthorized } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  const admin = await getSessionAdmin(request);
  if (!admin) return unauthorized();

  try {
    const institutionId = admin.institutionId;
    if (!institutionId) {
      return NextResponse.json({ sections: [] });
    }

    const snapshot = await adminDb
      .collection('students')
      .where('institutionId', '==', institutionId)
      .get();

    const sections = new Set<string>();
    snapshot.docs.forEach((doc) => {
      const section = doc.data().section;
      if (section) sections.add(section);
    });

    return NextResponse.json({ sections: Array.from(sections).sort() });
  } catch (error) {
    console.error('Get sections error:', error);
    return NextResponse.json({ error: 'Failed to fetch sections' }, { status: 500 });
  }
}
