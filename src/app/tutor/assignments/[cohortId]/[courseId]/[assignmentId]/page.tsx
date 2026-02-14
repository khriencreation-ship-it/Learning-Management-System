
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { unstable_noStore as noStore } from 'next/cache';
import AssignmentSubmissionsClient from '@/app/tutor/courses/[id]/submissions/[itemId]/AssignmentSubmissionsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getData(courseId: string, assignmentId: string) {
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
            .eq('id', assignmentId)
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

export default async function TutorAssignmentSubmissionsPage(props: any) {
    const params = await props.params;
    const { cohortId, courseId, assignmentId } = params;

    const data = await getData(courseId, assignmentId);

    if (!data) {
        notFound();
    }

    return <AssignmentSubmissionsClient
        assignment={data.assignment}
        courseId={courseId}
        courseTitle={data.courseTitle}
        cohortId={cohortId}
        backUrl={`/tutor/assignments/${cohortId}/${courseId}`}
    />;
}
