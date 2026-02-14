import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        const { data: course, error } = await supabaseAdmin
            .from('courses')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !course) {
            console.error('Error fetching course:', error);
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        return NextResponse.json(course);
    } catch (error) {
        console.error('Error fetching course:', error);
        return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const body = await request.json();
        const { students, cohorts, ...courseData } = body;

        // 1. Update Course Data
        const { data: course, error } = await supabaseAdmin
            .from('courses')
            .update(courseData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating course:', error);
            return NextResponse.json({ error: 'Failed to update course', details: error.message }, { status: 500 });
        }

        // 2. Update Enrollments (if provided)
        if (students && Array.isArray(students)) {
            // Delete existing
            const { error: delError } = await supabaseAdmin
                .from('course_enrollments')
                .delete()
                .eq('course_id', id);

            if (delError) {
                console.error('Error clearing enrollments:', delError);
            } else if (students.length > 0) {
                // Insert new
                const studentInserts = students.map((studentId: string) => ({
                    course_id: id,
                    student_id: studentId,
                    status: 'active'
                }));

                const { error: insError } = await supabaseAdmin
                    .from('course_enrollments')
                    .insert(studentInserts);

                if (insError) console.error('Error inserting enrollments:', insError);
            }
        }

        // 3. Update Cohorts (if provided)
        if (cohorts && Array.isArray(cohorts)) {
            // Delete existing
            const { error: delError } = await supabaseAdmin
                .from('course_cohorts')
                .delete()
                .eq('course_id', id);

            if (delError) {
                console.error('Error clearing cohorts:', delError);
            } else if (cohorts.length > 0) {
                // Insert new
                const cohortInserts = cohorts.map((cohortId: string) => ({
                    course_id: id,
                    cohort_id: cohortId
                }));

                const { error: insError } = await supabaseAdmin
                    .from('course_cohorts')
                    .insert(cohortInserts);

                if (insError) console.error('Error inserting cohorts:', insError);
            }
        }

        return NextResponse.json(course);
    } catch (error) {
        console.error('Error in course PATCH:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        // Note: Supabase cascades might need to be verified in the DB schema
        // but for now we attempt a simple delete.
        const { error } = await supabaseAdmin
            .from('courses')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting course:', error);
            return NextResponse.json({ error: 'Failed to delete course', details: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in course DELETE:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
