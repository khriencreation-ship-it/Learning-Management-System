import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { unstable_noStore as noStore } from 'next/cache';
import CourseBuilderPageClient from '../../../../../components/admin/course-builder/CourseBuilderPageClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getCourseData(id: string) {
    noStore();
    try {
        const { data: courseData, error } = await supabaseAdmin
            .from('courses')
            .select(`
                *,
                course_modules (
                    *,
                    module_items (*)
                ),
                course_enrollments (student_id),
                course_cohorts (cohort_id)
            `)
            .eq('id', id)
            .single();

        if (error || !courseData) {
            console.error("Error fetching course data for builder:", error);
            return null;
        }

        // Sort modules and items
        const sortedModules = (courseData.course_modules || [])
            .sort((a: any, b: any) => a.order_index - b.order_index)
            .map((mod: any) => ({
                ...mod,
                items: (mod.module_items || []).sort((a: any, b: any) => a.order_index - b.order_index)
            }));

        return {
            course: courseData,
            curriculum: sortedModules
        };
    } catch (error) {
        console.error('Error in getCourseData:', error);
        return null;
    }
}

export default async function CourseBuilderPage(props: any) {
    const params = await props.params;
    const { id } = params;

    const data = await getCourseData(id);

    if (!data) {
        notFound();
    }

    return (
        <CourseBuilderPageClient
            courseId={id}
            courseTitle={data.course.title}
            initialData={data.curriculum}
            courseSettings={{
                image: data.course.image,
                video: data.course.video_url,
                description: data.course.description,
                students: data.course.course_enrollments?.map((e: any) => e.student_id) || [],
                cohorts: data.course.course_cohorts?.map((c: any) => c.cohort_id) || []
            }}
        />
    );
}
