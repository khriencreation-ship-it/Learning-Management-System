import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-admin';
import CourseDetailsClient from '@/components/admin/courses/CourseDetailsClient';
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getCourse(id: string) {
    noStore();
    try {
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
    const { id } = params;

    const course = await getCourse(id);

    if (!course) {
        notFound();
    }

    return (
        <CourseDetailsClient 
            course={course} 
        />
    );
}

