import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { supabase } from '@/lib/supabase';

export const revalidate = 0;

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);

        if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // 1. Check if student is enrolled in this cohort
        const { data: enrollment, error: enrollError } = await supabaseAdmin
            .from('cohort_students')
            .select('*')
            .eq('cohort_id', id)
            .eq('student_id', user.id)
            .single();

        if (enrollError || !enrollment) {
            return NextResponse.json({ error: 'Not Enrolled' }, { status: 403 });
        }

        // 2. Fetch Cohort Details
        const { data: cohort, error: cohortError } = await supabaseAdmin
            .from('cohorts')
            .select('*')
            .eq('id', id)
            .single();

        if (cohortError || !cohort) {
            return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
        }

        // 3. Fetch Counts
        const { count: studentsCount } = await supabaseAdmin
            .from('cohort_students')
            .select('*', { count: 'exact', head: true })
            .eq('cohort_id', id);

        const { count: tutorsCount } = await supabaseAdmin
            .from('cohort_tutors')
            .select('*', { count: 'exact', head: true })
            .eq('cohort_id', id);

        // Fetch Courses
        const { data: courseData, count: coursesCount } = await supabaseAdmin
            .from('course_cohorts')
            .select('courses(*), settings', { count: 'exact' })
            .eq('cohort_id', id);

        const courses = courseData?.map((item: any) => ({
            ...item.courses,
            tutor: item.courses.instructor,
            settings: item.settings
        })) || [];

        const formattedCohort = {
            ...cohort,
            startDate: cohort.start_date,
            endDate: cohort.end_date,
            studentsCount: studentsCount || 0,
            tutorsCount: tutorsCount || 0,
            coursesCount: coursesCount || 0,
            courses
        };

        return NextResponse.json(formattedCohort);

    } catch (error: any) {
        console.error('Error fetching student cohort detail:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
