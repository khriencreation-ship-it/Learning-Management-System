import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { courseIds } = body;

        if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
            return NextResponse.json(
                { error: 'No courses selected' },
                { status: 400 }
            );
        }

        // Check for existing course assignments to avoid duplicates
        const { data: existing } = await supabaseAdmin
            .from('course_cohorts')
            .select('course_id')
            .eq('cohort_id', id)
            .in('course_id', courseIds);

        const existingIds = new Set(existing?.map(e => e.course_id) || []);
        const newCourseIds = courseIds.filter(cid => !existingIds.has(cid));

        if (newCourseIds.length === 0) {
            return NextResponse.json({ success: true, message: 'All selected courses are already assigned' });
        }

        // Prepare inserts for NEW assignments only
        const inserts = newCourseIds.map(courseId => ({
            cohort_id: id,
            course_id: courseId,
            assigned_at: new Date().toISOString()
        }));

        const { error } = await supabaseAdmin
            .from('course_cohorts')
            .insert(inserts);

        if (error) throw error;

        return NextResponse.json({ success: true, message: 'Courses assigned successfully' });
    } catch (error: any) {
        console.error('Error assigning courses:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to assign courses' },
            { status: 500 }
        );
    }
}
