import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { supabase } from '@/lib/supabase';

export const revalidate = 0;

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);

        if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const studentId = user.id;

        // 1. Fetch ALL Enrollments (Direct OR via Cohort)
        const { data: allEnrollments, error: enrollError } = await supabaseAdmin
            .from('course_enrollments')
            .select('course_id, cohort_id')
            .eq('student_id', studentId);

        if (enrollError) console.error('Error fetching enrollments:', enrollError);

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

        const courseMap = new Map();

        // 2. Fetch Course Details
        if (enrolledCourseIds.size > 0) {
            const { data: coursesData } = await supabaseAdmin
                .from('courses')
                .select(`
                    *,
                    course_cohorts (count)
                `)
                .in('id', Array.from(enrolledCourseIds));

            coursesData?.forEach((course: any) => {
                courseMap.set(course.id, { ...course, isLocked: false }); // Default false, will recalculate
            });
        }

        // 3. Fetch Settings and Cohort Names
        const settingsMap = new Map<string, boolean>();
        const cohortIdToNameMap = new Map<string, string>(); // cohortId -> name

        if (allCohortIds.size > 0 && enrolledCourseIds.size > 0) {
            const { data: cohortCourses } = await supabaseAdmin
                .from('course_cohorts')
                .select('cohort_id, course_id, settings, cohorts(name)')
                .in('cohort_id', Array.from(allCohortIds))
                .in('course_id', Array.from(enrolledCourseIds));

            cohortCourses?.forEach((cs: any) => {
                const key = `${cs.cohort_id}-${cs.course_id}`;
                settingsMap.set(key, cs.settings?.isLocked || false);

                // Map cohort_id to name
                if (cs.cohorts?.name) {
                    cohortIdToNameMap.set(cs.cohort_id, cs.cohorts.name);
                }
            });
        }

        // 4. Calculate Effective Lock Status
        courseMap.forEach((course, courseId) => {
            const enrollments = enrollmentsByCourse.get(courseId) || [];
            let hasOpenPath = false;
            const accessCohortNames = new Set<string>();

            for (const enr of enrollments) {
                if (!enr.cohort_id) {
                    hasOpenPath = true; // Direct enrollment
                    // Optional: accessCohortNames.add("Direct Enrollment");
                } else {
                    const isPathLocked = settingsMap.get(`${enr.cohort_id}-${courseId}`);
                    if (!isPathLocked) {
                        hasOpenPath = true; // Unlocked cohort
                        const name = cohortIdToNameMap.get(enr.cohort_id);
                        if (name) accessCohortNames.add(name);
                    }
                }
            }

            course.isLocked = !hasOpenPath;
            course.cohortNames = Array.from(accessCohortNames);
        });

        const courses = Array.from(courseMap.values())
            .filter((c: any) => ['active', 'published', 'completed'].includes(c.status));

        const formattedCourses = courses.map((c: any) => ({
            id: c.id,
            title: c.title,
            description: c.description,
            instructor: c.instructor,
            image: c.image,
            topics: c.topics_count || 0,
            lessons: c.lessons_count || 0,
            quizzes: c.quizzes_count || 0,
            assignments: c.assignments_count || 0,
            status: c.status,
            publishedAt: c.published_at,
            code: c.code,
            cohortsCount: c.course_cohorts?.[0]?.count || 0,
            isLocked: c.isLocked || false,
            cohortNames: c.cohortNames || []
        }));

        return NextResponse.json(formattedCourses);

    } catch (error: any) {
        console.error('Error fetching student courses:', error);
        return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
    }
}
