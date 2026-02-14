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

        const studentId = user.id;

        // 1. Verify Strict Enrollment & Fetch Context (and Settings)
        const { data: enrollments } = await supabaseAdmin
            .from('course_enrollments')
            .select('cohort_id, cohorts(name, course_cohorts(course_id, settings))')
            .eq('course_id', id)
            .eq('student_id', studentId);

        if (!enrollments || enrollments.length === 0) {
            return NextResponse.json({ error: 'Forbidden: Not enrolled in this course' }, { status: 403 });
        }

        // Extract UNLOCKED cohort names
        // We need to find the settings for THIS course in THAT cohort
        const cohortNames = enrollments
            .map((e: any) => {
                if (!e.cohorts) return null;

                // Find settings for this course in the cohort's course list
                const courseCohort = e.cohorts.course_cohorts?.find((cc: any) => cc.course_id === id);
                const isLocked = courseCohort?.settings?.isLocked || false;

                // Only return name if NOT locked
                return !isLocked ? e.cohorts.name : null;
            })
            .filter(Boolean); // Filter out nulls (locked or invalid)

        // 2. Fetch Course Details (Mirroring Tutor Logic)
        const { data: courseData, error: courseError } = await supabaseAdmin
            .from('courses')
            .select(`
                *,
                course_modules (
                    *,
                    module_items (*)
                ),
                course_cohorts (
                    cohort_id,
                    cohort:cohorts (name, status, batch)
                )
            `)
            .eq('id', id)
            .single();

        if (courseError || !courseData) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        // Sort modules and items
        const sortedModules = (courseData.course_modules || [])
            .sort((a: any, b: any) => a.order_index - b.order_index)
            .map((mod: any) => ({
                ...mod,
                items: (mod.module_items || []).sort((a: any, b: any) => a.order_index - b.order_index)
            }));

        // Calculate stats
        let lessonsCount = 0;
        let quizzesCount = 0;
        let assignmentsCount = 0;
        let liveClassesCount = 0;

        sortedModules.forEach((mod: any) => {
            mod.items.forEach((item: any) => {
                const type = item.type;
                if (type === 'quiz') quizzesCount++;
                else if (type === 'assignment') assignmentsCount++;
                else if (type === 'live-class' || type === 'live_class') liveClassesCount++;
                else lessonsCount++;
            });
        });

        const formattedCourse = {
            ...courseData,
            status: courseData.status || 'draft',
            curriculum: sortedModules,
            topics: sortedModules.length,
            lessons: lessonsCount,
            quizzes: quizzesCount,
            assignments: assignmentsCount,
            liveClasses: liveClassesCount,
            cohortNames: cohortNames
        };

        return NextResponse.json(formattedCourse);

    } catch (error: any) {
        console.error('Error fetching student course detail:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
