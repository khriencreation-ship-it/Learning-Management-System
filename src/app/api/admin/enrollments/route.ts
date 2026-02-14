import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const cohortId = searchParams.get('cohortId');

    if (!courseId || !cohortId) {
        return NextResponse.json({ error: 'Missing courseId or cohortId' }, { status: 400 });
    }

    try {
        console.log(`[API DEBUG] GET Enrollments - Course: ${courseId}, Cohort: ${cohortId}`);
        const { data, error } = await supabaseAdmin
            .from('course_enrollments')
            .select('student_id')
            .eq('course_id', courseId)
            .eq('cohort_id', cohortId);

        if (error) {
            console.error('Error fetching enrollments:', error);
            throw new Error(error.message);
        }

        console.log(`[API DEBUG] Found ${data?.length} enrollments`);

        return NextResponse.json({
            studentIds: data.map((e: any) => e.student_id)
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { studentIds, courseId, cohortId } = (body as any);

        if (!studentIds || !Array.isArray(studentIds) || !courseId || !cohortId) {
            return NextResponse.json(
                { error: 'Missing required fields: studentIds, courseId, cohortId' },
                { status: 400 }
            );
        }

        // Prepare inserts
        // We use upsert to be safe, or just insert and ignore duplicates
        const inserts = studentIds.map((studentId: string) => ({
            student_id: studentId,
            course_id: courseId,
            cohort_id: cohortId,
            enrolled_at: new Date().toISOString(),
            status: 'active'
        }));

        const { error } = await supabaseAdmin
            .from('course_enrollments')
            .upsert(inserts, { onConflict: 'course_id, student_id, cohort_id' });

        if (error) {
            throw error;
        }

        return NextResponse.json({ success: true, message: 'Students enrolled in course successfully' });
    } catch (error: any) {
        console.error('Error enrolling in course:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to enroll in course' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const body = await request.json();
        const { studentIds, courseId, cohortId } = (body as any);

        if (!studentIds || !Array.isArray(studentIds) || !courseId || !cohortId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const { error } = await supabaseAdmin
            .from('course_enrollments')
            .delete()
            .eq('course_id', courseId)
            .eq('cohort_id', cohortId)
            .in('student_id', studentIds);

        if (error) {
            throw error;
        }

        return NextResponse.json({ success: true, message: 'Students unenrolled from course' });
    } catch (error: any) {
        console.error('Error unenrolling from course:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to unenroll' },
            { status: 500 }
        );
    }
}
