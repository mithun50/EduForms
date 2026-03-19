import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionAdmin, unauthorized, forbidden } from '@/lib/api-helpers';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await getSessionAdmin(request);
  if (!admin) return unauthorized();

  try {
    const doc = await adminDb.collection('students').doc(id).get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const student = doc.data()!;

    // institution_admin can only delete students from their own institution
    // that they personally added
    if (admin.role === 'institution_admin') {
      if (student.institutionId !== admin.institutionId) {
        return forbidden();
      }
      if (student.addedBy && student.addedBy !== admin.uid) {
        return forbidden();
      }
    }

    await adminDb.collection('students').doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete student error:', error);
    return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 });
  }
}
