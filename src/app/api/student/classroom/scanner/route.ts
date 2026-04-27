import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { supabase } from '@/lib/supabase';

export const revalidate = 0;

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);

        if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // 1. Get student courses
        const { data: enrollments } = await supabaseAdmin
            .from('course_enrollments')
            .select('course_id, cohort_id')
            .eq('student_id', user.id);

        const { data: cohortStudents } = await supabaseAdmin
            .from('cohort_students')
            .select('cohort_id')
            .eq('student_id', user.id);

        const courseIds = Array.from(new Set(enrollments?.map(e => e.course_id) || []));
        const cohortIds = Array.from(new Set(cohortStudents?.map(cs => cs.cohort_id) || []));

        // Get courses linked via cohorts
        if (cohortIds.length > 0) {
            const { data: cc } = await supabaseAdmin
                .from('course_cohorts')
                .select('course_id')
                .in('cohort_id', cohortIds);
            cc?.forEach(c => courseIds.push(c.course_id));
        }

        const uniqueCourseIds = Array.from(new Set(courseIds));

        if (uniqueCourseIds.length === 0) {
            return NextResponse.json({ items: [] });
        }

        // 2. Fetch all module items for these courses
        const { data: items, error } = await supabaseAdmin
            .from('module_items')
            .select(`
                id,
                title,
                type,
                metadata,
                course_modules!inner(course_id)
            `)
            .in('course_modules.course_id', uniqueCourseIds);

        if (error) throw error;

        // 3. Filter for items with unlock dates or deadlines in metadata
        const scanItems = items
            .map((item: any) => ({
                ...item,
                course_id: item.course_modules.course_id
            }))
            .filter(item => {
                const meta = item.metadata || {};
                return meta.unlockDate || meta.deadline;
            });

        return NextResponse.json({ items: scanItems });
    } catch (error: any) {
        console.error('Error in scanner API:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
