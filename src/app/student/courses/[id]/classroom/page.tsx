
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
                        let meta = item.metadata || {};
                        if (typeof meta === 'string') {
                            try { meta = JSON.parse(meta); } catch (e) { meta = {}; }
                        }
                        
                        return {
                            ...item,
                            ...meta,
                            metadata: meta, // Keep it for defensive checks
                            title: item.title,
                            summary: item.summary
                        };
                    })
            }));

        console.log("SERVER PASSING TO CLIENT:", JSON.stringify(sortedModules, null, 2));
        return {
            ...courseData,
            curriculum: sortedModules
        };
    } catch (error) {
        console.error('Error fetching course for classroom:', error);
        return null;
    }
}

const isItemLocked = (item: any) => {
    const hasUnlockDate = item.hasUnlockDate ?? item.metadata?.hasUnlockDate;
    const unlockDate = item.unlockDate ?? item.metadata?.unlockDate;
    const unlockTime = item.unlockTime ?? item.metadata?.unlockTime;

    if (!hasUnlockDate || !unlockDate) return false;
    
    try {
        const timeStr = unlockTime || "00:00";
        const unlockDateTime = new Date(`${unlockDate}T${timeStr}:00`);
        if (isNaN(unlockDateTime.getTime())) return false;
        return unlockDateTime.getTime() > new Date().getTime();
    } catch (e) {
        return false;
    }
};

export default async function Page(props: any) {
    const params = await props.params;
    const searchParams = await props.searchParams;
    const { id } = params;
    const cohortId = searchParams.cohortId;

    const course = await getCourse(id);

    if (!course) {
        notFound();
    }

    if (searchParams.debug === '1') {
        return <pre>{JSON.stringify(course, null, 2)}</pre>;
    }

    return (
        <StudentClassroomClient
            course={course}
            exitHref={`/student/courses/${id}`}
            cohortId={cohortId}
        />
    );
}
