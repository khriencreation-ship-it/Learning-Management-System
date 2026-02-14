import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { unstable_noStore as noStore } from 'next/cache';
import TutorClassroomClient from '@/app/tutor/courses/[id]/classroom/TutorClassroomClient';

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
                items: (mod.module_items || []).sort((a: any, b: any) => a.order_index - b.order_index).map((item: any) => {
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
        console.error('Error fetching course for admin classroom:', error);
        return null;
    }
}

export default async function AdminClassroomPage(props: any) {
    const params = await props.params;
    const { id } = params;

    const course = await getCourse(id);

    if (!course) {
        notFound();
    }

    return (
        <TutorClassroomClient
            course={course}
            isAdmin={true}
            exitHref={`/admin/courses/${id}`}
        />
    );
}
