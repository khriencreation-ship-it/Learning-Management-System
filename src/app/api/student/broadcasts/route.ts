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

        // 1. Fetch assigned cohorts for this student
        const { data: cohortStudents, error: cohortError } = await supabaseAdmin
            .from('cohort_students')
            .select('cohort_id')
            .eq('student_id', user.id);

        if (cohortError) throw cohortError;
        const cohortIds = cohortStudents?.map(cs => cs.cohort_id) || [];

        if (cohortIds.length === 0) {
            return NextResponse.json([]); // No cohorts, no broadcasts
        }

        // 2. Fetch broadcasts for these cohorts
        const { data: broadcasts, error: broadcastError } = await supabaseAdmin
            .from('announcements')
            .select(`
                *,
                cohorts ( name ),
                courses ( title )
            `)
            .in('cohort_id', cohortIds)
            .order('created_at', { ascending: false });

        if (broadcastError) throw broadcastError;

        // 3. Map for cleaner response
        const formattedBroadcasts = broadcasts?.map((item: any) => ({
            id: item.id,
            title: item.title,
            message: item.message,
            target_type: item.target_type,
            cohort_id: item.cohort_id,
            course_id: item.course_id,
            created_at: item.created_at,
            cohort_name: item.cohorts?.name,
            course_title: item.courses?.title,
            sender_role: item.sender_id ? 'tutor' : 'admin'
        })) || [];

        return NextResponse.json(formattedBroadcasts);

    } catch (error: any) {
        console.error('Error fetching student broadcasts:', error);
        return NextResponse.json({ error: 'Failed to fetch broadcasts' }, { status: 500 });
    }
}
