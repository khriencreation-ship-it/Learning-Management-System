import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-admin';
import CourseDetailsClient from '@/components/admin/courses/CourseDetailsClient';
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getCourse(id: string, page: number = 1, pageSize: number = 25) {
    noStore();
    try {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        // Fetch course details
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
            console.error("Error fetching course data:", courseError);
            return null;
        }

        // Fetch paginated enrollments
        const { data: enrollments, error: enrollError, count: totalCount } = await supabaseAdmin
            .from('course_enrollments')
            .select(`
                student_id,
                student:profiles (id, full_name, identifier)
            `, { count: 'exact' })
            .eq('course_id', id)
            .range(from, to);

        if (enrollError) {
            console.error("Error fetching enrollments:", enrollError);
        }

        // Deduplicate enrollments by student_id (handle multi-cohort enrollments if any)
        const uniqueEnrollments = Array.from(
            new Map(
                (enrollments || []).map((e: any) => [e.student_id, e])
            ).values()
        );

        // Sort modules and items by order_index
        const sortedModules = (courseData.course_modules || [])
            .sort((a: any, b: any) => a.order_index - b.order_index)
            .map((mod: any) => ({
                ...mod,
                items: (mod.module_items || []).sort((a: any, b: any) => a.order_index - b.order_index)
            }));

        // Calculate real-time stats
        const topicsCount = sortedModules.length;
        let lessonsCount = 0;
        let quizzesCount = 0;
        let assignmentsCount = 0;
        let liveClassesCount = 0;

        sortedModules.forEach((mod: any) => {
            const items = mod.module_items || [];
            items.forEach((item: any) => {
                const type = item.type;
                if (type === 'quiz') quizzesCount++;
                else if (type === 'assignment') assignmentsCount++;
                else if (type === 'live-class' || type === 'live_class') {
                    liveClassesCount++;
                } else {
                    lessonsCount++;
                }
            });
        });

        // Format dates on the server side
        const formattedCourse = {
            ...courseData,
            course_enrollments: uniqueEnrollments,
            total_enrollments_count: totalCount || 0,
            status: courseData.status || 'draft',
            publishedAt: courseData.published_at ? new Date(courseData.published_at).toLocaleDateString('en-US', {
                month: 'short', day: '2-digit', year: 'numeric'
            }) : null,
            curriculum: sortedModules,
            topics: topicsCount,
            lessons: lessonsCount,
            quizzes: quizzesCount,
            assignments: assignmentsCount,
            liveClasses: liveClassesCount
        };

        return formattedCourse;
    } catch (error) {
        console.error('Error fetching course:', error);
        return null;
    }
}

export default async function CourseDetailsPage(props: any) {
    const params = await props.params;
    const searchParams = await props.searchParams;
    const { id } = params;
    const page = parseInt(searchParams.page as string) || 1;
    const pageSize = 25;

    const course = await getCourse(id, page, pageSize);

    if (!course) {
        notFound();
    }

    return (
        <CourseDetailsClient 
            course={course} 
            currentPage={page} 
            pageSize={pageSize} 
        />
    );
}

