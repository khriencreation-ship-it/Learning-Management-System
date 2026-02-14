import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { supabase } from '@/lib/supabase';
import { getCohortStatus } from '@/lib/cohortUtils';

export const revalidate = 0;

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);

        if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Fetch assigned cohorts via cohort_tutors join
        const { data: cohortTutors, error } = await supabaseAdmin
            .from('cohort_tutors')
            .select(`
                cohort_id,
                cohorts (
                    *,
                    cohort_students (count),
                    cohort_tutors (count),
                    course_cohorts (count)
                )
            `)
            .eq('tutor_id', user.id);

        if (error) throw error;

        const cohorts = cohortTutors?.map((ct: any) => {
            const c = ct.cohorts;
            if (!c) return null;
            return {
                id: c.id,
                name: c.name,
                batch: c.batch,
                image: c.image,
                description: c.description,
                start_date: c.start_date,
                end_date: c.end_date,
                status: getCohortStatus(c.start_date, c.end_date), // Dynamic status
                studentsCount: c.cohort_students?.[0]?.count || 0,
                tutorsCount: c.cohort_tutors?.[0]?.count || 0,
                coursesCount: c.course_cohorts?.[0]?.count || 0
            };
        }).filter(Boolean) || [];

        return NextResponse.json(cohorts);

    } catch (error: any) {
        console.error('Error fetching tutor cohorts:', error);
        return NextResponse.json({ error: 'Failed to fetch cohorts' }, { status: 500 });
    }
}
