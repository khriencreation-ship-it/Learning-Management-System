import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { supabase } from '@/lib/supabase';

export const revalidate = 0;

export async function GET(req: NextRequest) {
    try {
        // Authenticate user via token from header
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);

        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify role
        if (user.user_metadata?.role !== 'tutor') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const tutorId = user.id;

        // Fetch Cohorts to find courses in assigned cohorts
        const { data: cohortTutors, error: cohortError } = await supabaseAdmin
            .from('cohort_tutors')
            .select('cohort_id, cohorts(*)')
            .eq('tutor_id', tutorId);

        if (cohortError) console.error('Error fetching cohorts:', cohortError);

        const cohorts = cohortTutors?.map((ct: any) => ct.cohorts).filter(Boolean) || [];

        // Fetch Tutor Profile to get Name (for legacy string-based assignment)
        const { data: tutorProfile } = await supabaseAdmin
            .from('profiles')
            .select('full_name')
            .eq('id', tutorId)
            .single();

        const tutorName = tutorProfile?.full_name;

        // Fetch Courses
        // Strategy: 
        // 1. Check 'courses' table for 'instructor' string match (Legacy/Current method).
        // 2. Check 'course_tutors' (Direct ID assignment - Future proof).
        // 3. Check 'course_cohorts' (Courses in assigned cohorts).

        const courseMap = new Map();

        // 1. String Match (by Name)
        if (tutorName) {
            const { data: assignedCourses } = await supabaseAdmin
                .from('courses')
                .select('*, course_cohorts(count)')
                .eq('instructor', tutorName);

            if (assignedCourses) {
                assignedCourses.forEach((c: any) => courseMap.set(c.id, c));
            }
        }

        // 2. Direct Assignment (ID based)
        const { data: courseTutors, error: courseError } = await supabaseAdmin
            .from('course_tutors')
            .select('course_id, courses(*, course_cohorts(count))')
            .eq('tutor_id', tutorId);

        if (courseTutors && courseTutors.length > 0) {
            courseTutors.map((ct: any) => ct.courses).filter(Boolean).forEach((c: any) => courseMap.set(c.id, c));
        }

        // 3. Filter by Cohort ID if provided
        const { searchParams } = new URL(req.url);
        const cohortId = searchParams.get('cohortId');

        let courses = Array.from(courseMap.values());

        if (cohortId) {
            // Fetch course IDs in this cohort
            const { data: cohortCourses } = await supabaseAdmin
                .from('course_cohorts')
                .select('course_id')
                .eq('cohort_id', cohortId);

            const allowedCourseIds = new Set(cohortCourses?.map(cc => cc.course_id) || []);
            courses = courses.filter(c => allowedCourseIds.has(c.id));
        }

        // Format courses for frontend
        const formattedCourses = courses.map((c: any) => ({
            id: c.id,
            title: c.title,
            description: c.description,
            instructor: c.instructor,
            image: c.image,
            topics: c.topics_count,
            lessons: c.lessons_count,
            quizzes: c.quizzes_count,
            assignments: c.assignments_count,
            status: c.status,
            publishedAt: c.published_at,
            createdAt: c.created_at,
            code: c.code,
            cohortsCount: c.course_cohorts?.[0]?.count || 0
        }));

        return NextResponse.json(formattedCourses);

    } catch (error: any) {
        console.error('Error in tutor courses API:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
