
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { unstable_noStore as noStore } from 'next/cache';
import AssignmentSubmissionsClient from '@/app/tutor/courses/[id]/submissions/[itemId]/AssignmentSubmissionsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getData(courseId: string, itemId: string) {
    noStore();
    try {
        // Fetch Assignment Details
        const { data: item, error: itemError } = await supabaseAdmin
            .from('module_items')
            .select(`
                *,
                module:course_modules!module_items_module_id_fkey (
                    course:courses!course_modules_course_id_fkey (title)
                )
            `)
            .eq('id', itemId)
            .single();

        if (itemError || !item) return null;

        return {
            assignment: item,
            courseTitle: item.module?.course?.title
        };
    } catch (error) {
        console.error('Error fetching submission data:', error);
        return null;
    }
}

export default async function AssignmentSubmissionsPage(props: any) {
    const params = await props.params;
    const { id, itemId } = params;

    const data = await getData(id, itemId);

    if (!data) {
        notFound();
    }

    return <AssignmentSubmissionsClient
        assignment={data.assignment}
        courseId={id}
        courseTitle={data.courseTitle}
    />;
}
