
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        // 1. Fetch cohort details
        const { data: cohort, error: cohortError } = await supabaseAdmin
            .from('cohorts')
            .select('*')
            .eq('id', id)
            .single();

        if (cohortError) {
            console.error('Error fetching cohort:', cohortError);
            throw new Error('Cohort not found');
        }

        // 2. Fetch associated course IDs from course_cohorts
        const { data: courseCohorts, error: linkError } = await supabaseAdmin
            .from('course_cohorts')
            .select('course_id')
            .eq('cohort_id', id);

        if (linkError) {
            console.error('Error fetching course links:', linkError);
            // Non-fatal, just return empty courses
        }

        const courseIds = courseCohorts ? courseCohorts.map((cc: any) => cc.course_id) : [];

        // 3. Fetch course details
        let courses: any[] = [];
        if (courseIds.length > 0) {
            const { data: coursesData, error: coursesError } = await supabaseAdmin
                .from('courses')
                .select('id, title, instructor') // Verified column is 'instructor' in schema, though 'tutor' is used in frontend often. Let's fetch instructor.
                .in('id', courseIds);

            if (coursesError) {
                console.error('Error fetching courses:', coursesError);
            } else {
                courses = coursesData || [];
            }

            // 4. Fetch enrollment counts for these courses IN THIS COHORT
            const { data: enrollments, error: enrollError } = await supabaseAdmin
                .from('course_enrollments')
                .select('course_id')
                .eq('cohort_id', id)
                .in('course_id', courseIds);

            if (enrollError) {
                console.error('Error fetching enrollment counts:', enrollError);
            }

            if (!enrollError && enrollments) {
                console.log(`[DEBUG] Found ${enrollments.length} enrollments for cohort ${id}`);
                console.log(`[DEBUG] Course IDs queried:`, courseIds);

                // Count per course
                const counts: Record<string, number> = {};
                enrollments.forEach((e: any) => {
                    counts[e.course_id] = (counts[e.course_id] || 0) + 1;
                });
                console.log(`[DEBUG] Calculated counts:`, counts);

                // Attach to course objects
                courses = courses.map(c => ({
                    ...c,
                    tutor: c.instructor, // Map instructor to tutor for frontend compatibility if needed, or just keep as is
                    student_count: counts[c.id] || 0
                }));
            }
        }

        const response = {
            ...cohort,
            courses
        };

        return NextResponse.json(response);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        // 1. Delete associated students (enrollments)
        const { error: studentError } = await supabaseAdmin
            .from('cohort_students')
            .delete()
            .eq('cohort_id', id);

        if (studentError) {
            console.error('Error deleting cohort students:', studentError);
            throw new Error('Failed to delete associated students');
        }

        // 2. Delete associated tutors
        const { error: tutorError } = await supabaseAdmin
            .from('cohort_tutors')
            .delete()
            .eq('cohort_id', id);

        if (tutorError) {
            console.error('Error deleting cohort tutors:', tutorError);
            throw new Error('Failed to delete associated tutors');
        }

        // 3. Delete associated courses
        const { error: courseError } = await supabaseAdmin
            .from('course_cohorts')
            .delete()
            .eq('cohort_id', id);

        if (courseError) {
            console.error('Error deleting cohort courses:', courseError);
            throw new Error('Failed to delete associated courses');
        }

        // 4. Delete associated student activity data
        // This ensures no orphaned progress/submissions remain for the deleted cohort
        const cleanupPromises = [
            supabaseAdmin.from('course_enrollments').delete().eq('cohort_id', id),
            supabaseAdmin.from('assignment_submissions').delete().eq('cohort_id', id),
            supabaseAdmin.from('quiz_submissions').delete().eq('cohort_id', id),
            supabaseAdmin.from('student_progress').delete().eq('cohort_id', id)
        ];

        const results = await Promise.all(cleanupPromises);
        results.forEach((res, index) => {
            if (res.error) {
                console.error(`Error cleaning up cohort data in table ${index}:`, res.error);
            }
        });

        // 5. Finally, delete the cohort itself
        const { error: cohortError } = await supabaseAdmin
            .from('cohorts')
            .delete()
            .eq('id', id);

        if (cohortError) {
            console.error('Error deleting cohort:', cohortError);
            throw new Error('Failed to delete cohort');
        }

        return NextResponse.json({ message: 'Cohort deleted successfully' });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const body = await request.json();

        // Validate required fields if necessary (usually handled by frontend, but good to have)
        // const { name, batch, startDate, endDate } = body;

        const { data, error } = await supabaseAdmin
            .from('cohorts')
            .update({
                name: body.name,
                batch: body.batch,
                description: body.description,
                start_date: body.startDate,
                end_date: body.endDate,
                image: body.image,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating cohort:', error);
            throw new Error(error.message);
        }

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
