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
            console.error('Tutor Auth Error:', userError?.message || 'No user found for token');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify role
        if (user.user_metadata?.role !== 'tutor') {
            // In development we might be lenient, but strictly this is for tutors
        }

        const tutorId = user.id;

        // Fetch Cohorts
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

        const courseMap = new Map();

        // 1. Get directly assigned courses (via course_tutors table or instructor name)
        const assignedCourseIds = new Set();

        // Direct ID Match
        const { data: ctData } = await supabaseAdmin
            .from('course_tutors')
            .select('course_id')
            .eq('tutor_id', tutorId);
        ctData?.forEach(item => assignedCourseIds.add(item.course_id));

        // Name Match
        if (tutorName) {
            const { data: instructorCourses } = await supabaseAdmin
                .from('courses')
                .select('id')
                .eq('instructor', tutorName);
            instructorCourses?.forEach(item => assignedCourseIds.add(item.id));
        }

        // 2. Fetch Course-Cohort relationships for these assigned courses
        // and only for the cohorts the tutor is assigned to
        if (assignedCourseIds.size > 0 && cohorts.length > 0) {
            const cohortIds = cohorts.map(c => c.id);
            const { data: ccData } = await supabaseAdmin
                .from('course_cohorts')
                .select('course_id, cohort_id, courses(*)')
                .in('course_id', Array.from(assignedCourseIds))
                .in('cohort_id', cohortIds);

            if (ccData) {
                ccData.forEach(item => {
                    if (!item.courses) return;

                    if (courseMap.has(item.course_id)) {
                        const existing = courseMap.get(item.course_id);
                        if (!existing.cohort_ids.includes(item.cohort_id)) {
                            existing.cohort_ids.push(item.cohort_id);
                        }
                    } else {
                        courseMap.set(item.course_id, {
                            ...item.courses,
                            cohort_ids: [item.cohort_id]
                        });
                    }
                });
            }
        }

        const courses = Array.from(courseMap.values());

        // Fetch Broadcasts (Correct table: 'announcements')
        // Filter by Cohorts and Courses relevant to the tutor
        let broadcasts: any[] = [];
        try {
            const myCohortIds = cohorts.map((c: any) => c.id);
            const myCourseIds = courses.map((c: any) => c.id);

            // Build query
            let query = supabaseAdmin
                .from('announcements')
                .select(`
                    *,
                    cohorts ( name ),
                    courses ( title )
                `)
                .order('created_at', { ascending: false })
                .limit(10);

            // Apply OR filter: (cohort_id IN myCohortIds) OR (course_id IN myCourseIds)
            // Supabase .or() syntax: 'cohort_id.in.(...),course_id.in.(...)'

            const conditions = [];
            if (myCohortIds.length > 0) {
                conditions.push(`cohort_id.in.(${myCohortIds.join(',')})`);
            }
            if (myCourseIds.length > 0) {
                conditions.push(`course_id.in.(${myCourseIds.join(',')})`);
            }

            if (conditions.length > 0) {
                query = query.or(conditions.join(','));

                const { data: broadcastData, error: broadcastError } = await query;

                if (!broadcastError && broadcastData) {
                    broadcasts = broadcastData.map((item: any) => ({
                        id: item.id,
                        title: item.title,
                        message: item.message,
                        target_type: item.target_type,
                        created_at: item.created_at,
                        cohort_name: item.cohorts?.name,
                        course_title: item.courses?.title,
                        sender_role: item.sender_id ? 'tutor' : 'admin'
                    }));
                } else if (broadcastError) {
                    console.error('Error fetching announcements:', broadcastError);
                }
            }

        } catch (e) {
            console.warn('Error processing broadcast logic', e);
        }

        return NextResponse.json({
            cohorts,
            courses,
            broadcasts
        });

    } catch (error: any) {
        console.error('Error in tutor dashboard API:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
