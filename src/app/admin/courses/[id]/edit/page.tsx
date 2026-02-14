import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-admin';
import EditCourseClient from '@/components/admin/courses/EditCourseClient';
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';

async function getCourse(id: string) {
    noStore();
    try {
        const { data: courseData, error } = await supabaseAdmin
            .from('courses')
            .select('*, course_enrollments(*), course_cohorts(*)')
            .eq('id', id)
            .single();

        if (error) {
            console.error("Error fetching course data:", error);
            return null;
        }

        if (!courseData) return null;

        return courseData;
    } catch (error) {
        console.error('Error fetching course:', error);
        return null;
    }
}

export default async function EditCoursePage(props: any) {
    const params = await props.params;
    const { id } = params;
    const course = await getCourse(id);

    if (!course) {
        notFound();
    }

    return <EditCourseClient course={course} />;
}
