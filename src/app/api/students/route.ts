import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionAdmin, unauthorized, badRequest } from '@/lib/api-helpers';
import { studentSchema } from '@/lib/utils/validation';

export async function GET(request: NextRequest) {
  const admin = await getSessionAdmin(request);
  if (!admin) return unauthorized();

  try {
    const { searchParams } = new URL(request.url);
    // institution_admin always uses their own institutionId
    // super_admin can optionally filter by institutionId
    const institutionId = admin.role === 'institution_admin'
      ? admin.institutionId
      : searchParams.get('institutionId');

    if (admin.role === 'institution_admin' && !institutionId) {
      return badRequest('Institution ID is required');
    }

    let query: FirebaseFirestore.Query = adminDb.collection('students');

    if (institutionId) {
      query = query.where('institutionId', '==', institutionId);
    }

    const department = searchParams.get('department');
    if (department) {
      query = query.where('department', '==', department);
    }

    const year = searchParams.get('year');
    if (year) {
      query = query.where('year', '==', year);
    }

    const snapshot = await query.get();
    let students = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }));

    // institution_admin only sees students they personally added
    if (admin.role === 'institution_admin') {
      students = students.filter((s) => {
        const data = s as Record<string, unknown>;
        // Include students added by this admin, or legacy students with no addedBy field
        return data.addedBy === admin.uid || !data.addedBy;
      });
    }

    students.sort((a, b) => {
      const aDate = (a as Record<string, string>).createdAt || '';
      const bDate = (b as Record<string, string>).createdAt || '';
      return bDate.localeCompare(aDate);
    });

    return NextResponse.json({ students });
  } catch (error) {
    console.error('Get students error:', error);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await getSessionAdmin(request);
  if (!admin) return unauthorized();

  try {
    const body = await request.json();

    // Bulk upload
    if (Array.isArray(body.students)) {
      // institution_admin: always use their own institutionId (ignore body)
      const institutionId = admin.role === 'institution_admin'
        ? admin.institutionId
        : (body.institutionId || admin.institutionId);
      if (!institutionId) return badRequest('Institution ID is required');

      const batchId = new Date().toISOString();
      const batch = adminDb.batch();
      const errors: string[] = [];

      for (let i = 0; i < body.students.length; i++) {
        const parsed = studentSchema.safeParse(body.students[i]);
        if (!parsed.success) {
          errors.push(`Row ${i + 1}: ${parsed.error.issues[0].message}`);
          continue;
        }

        const ref = adminDb.collection('students').doc();
        batch.set(ref, {
          ...parsed.data,
          institutionId,
          addedBy: admin.uid,
          batchId,
          createdAt: new Date().toISOString(),
        });
      }

      if (errors.length > 0 && errors.length === body.students.length) {
        return badRequest(`All rows failed: ${errors.slice(0, 5).join('; ')}`);
      }

      await batch.commit();
      return NextResponse.json({
        success: true,
        imported: body.students.length - errors.length,
        errors,
        batchId,
      }, { status: 201 });
    }

    // Single student
    const parsed = studentSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message);
    }

    // institution_admin: always use their own institutionId (ignore body)
    const institutionId = admin.role === 'institution_admin'
      ? admin.institutionId
      : (body.institutionId || admin.institutionId);
    if (!institutionId) return badRequest('Institution ID is required');

    const docRef = await adminDb.collection('students').add({
      ...parsed.data,
      institutionId,
      addedBy: admin.uid,
      batchId: '',
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ id: docRef.id }, { status: 201 });
  } catch (error) {
    console.error('Create student error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create student';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
