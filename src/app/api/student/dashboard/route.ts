import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { supabase } from '@/lib/supabase';

export const revalidate = 0;

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);

        if (userError || !user) {
            console.error('Student Auth Error:', userError?.message || 'No user found for token');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const studentId = user.id;

        // 1. Fetch Cohorts the student is in
        const { data: cohortStudents, error: cohortError } = await supabaseAdmin
            .from('cohort_students')
            .select('cohort_id, cohorts(*)')
            .eq('student_id', studentId);

        if (cohortError) console.error('Error fetching student cohorts:', cohortError);
        const cohorts = cohortStudents?.map((cs: any) => cs.cohorts).filter(Boolean) || [];
        const cohortIds = cohorts.map((c: any) => c.id);

        // 2. Fetch Courses
        const courseMap = new Map();

        // 2. Fetch ALL Enrollments (Direct OR via Cohort)
        const { data: allEnrollments } = await supabaseAdmin
            .from('course_enrollments')
            .select('course_id, cohort_id')
            .eq('student_id', studentId);

        const enrollmentsByCourse = new Map<string, any[]>();
        const allCohortIds = new Set<string>();
        const enrolledCourseIds = new Set<string>();

        allEnrollments?.forEach((e: any) => {
            if (!enrollmentsByCourse.has(e.course_id)) {
                enrollmentsByCourse.set(e.course_id, []);
                enrolledCourseIds.add(e.course_id);
            }
            enrollmentsByCourse.get(e.course_id)?.push(e);

            if (e.cohort_id) {
                allCohortIds.add(e.cohort_id);
            }
        });

        // 2a. Fetch Course Details
        if (enrolledCourseIds.size > 0) {
            const { data: enrollmentDetails } = await supabaseAdmin
                .from('courses')
                .select('*')
                .in('id', Array.from(enrolledCourseIds));

            enrollmentDetails?.forEach((course: any) => {
                courseMap.set(course.id, { ...course, isLocked: false });
            });
        }

        // 3. Fetch Settings and Calculate Effective Lock
        const settingsMap = new Map<string, boolean>();

        if (allCohortIds.size > 0 && enrolledCourseIds.size > 0) {
            const { data: cohortCourses } = await supabaseAdmin
                .from('course_cohorts')
                .select('cohort_id, course_id, settings')
                .in('cohort_id', Array.from(allCohortIds))
                .in('course_id', Array.from(enrolledCourseIds));

            cohortCourses?.forEach((cs: any) => {
                const key = `${cs.cohort_id}-${cs.course_id}`;
                settingsMap.set(key, cs.settings?.isLocked || false);
            });
        }

        // 4. Determine final lock status
        courseMap.forEach((course, courseId) => {
            const enrollments = enrollmentsByCourse.get(courseId) || [];
            let hasOpenPath = false;

            for (const enr of enrollments) {
                if (!enr.cohort_id) {
                    hasOpenPath = true; // Direct enrollment
                    break;
                }
                const isPathLocked = settingsMap.get(`${enr.cohort_id}-${courseId}`);
                if (!isPathLocked) {
                    hasOpenPath = true; // Unlocked cohort
                    break;
                }
            }
            course.isLocked = !hasOpenPath;
        });

        const courses = Array.from(courseMap.values())
            .filter((c: any) => ['active', 'published', 'completed'].includes(c.status));
        const courseIds = courses.map((c: any) => c.id);

        // 3. Fetch Broadcasts (Announcements)
        let broadcasts: any[] = [];
        const conditions = [];
        if (cohortIds.length > 0) {
            conditions.push(`cohort_id.in.(${cohortIds.join(',')})`);
        }
        if (courseIds.length > 0) {
            conditions.push(`course_id.in.(${courseIds.join(',')})`);
        }

        if (conditions.length > 0) {
            const { data: broadcastData, error: broadcastError } = await supabaseAdmin
                .from('announcements')
                .select(`
                    *,
                    cohorts ( name ),
                    courses ( title )
                `)
                .or(conditions.join(','))
                .order('created_at', { ascending: false })
                .limit(10);

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

        return NextResponse.json({
            cohorts,
            courses,
            broadcasts
        });

    } catch (error: any) {
        console.error('Error in student dashboard API:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
