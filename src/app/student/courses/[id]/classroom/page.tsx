
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { unstable_noStore as noStore } from 'next/cache';
import StudentClassroomClient from '@/components/student/courses/StudentClassroomClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getCourse(id: string) {
    noStore();
    try {
        const { data: courseData, error } = await supabaseAdmin
            .from('courses')
            .select(`
                *,
                course_modules (
                    *,
                    module_items (*)
                )
            `)
            .eq('id', id)
            .single();

        if (error || !courseData) {
            return null;
        }

        // Sort modules and items by order_index
        const sortedModules = (courseData.course_modules || [])
            .sort((a: any, b: any) => a.order_index - b.order_index)
            .map((mod: any) => ({
                ...mod,
                items: (mod.module_items || [])
                    .sort((a: any, b: any) => a.order_index - b.order_index)
                    .map((item: any) => {
                        // Normalize metadata
                        const meta = item.metadata || {};
                        return {
                            ...item,
                            ...meta,
                            title: item.title,
                            summary: item.summary
                        };
                    })
            }));

        return {
            ...courseData,
            curriculum: sortedModules
        };
    } catch (error) {
        console.error('Error fetching course for classroom:', error);
        return null;
    }
}

export default async function Page(props: any) {
    const params = await props.params;
    const searchParams = await props.searchParams;
    const { id } = params;
    const cohortId = searchParams.cohortId;

    const course = await getCourse(id);

    if (!course) {
        notFound();
    }

    return (
        <StudentClassroomClient
            course={course}
            exitHref={cohortId ? `/student/cohorts/${cohortId}` : `/student/courses/${id}`}
            cohortId={cohortId}
        />
    );
}
