
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const itemId = searchParams.get('itemId');
        const courseId = searchParams.get('courseId');
        const cohortId = searchParams.get('cohortId');

        console.log('Fetching submissions for:', { itemId, courseId, cohortId });

        if (!itemId && !courseId && !cohortId) {
            return NextResponse.json({ error: 'Missing itemId, courseId, or cohortId' }, { status: 400 });
        }

        let query = supabaseAdmin
            .from('assignment_submissions')
            .select(`
                *,
                student:profiles (
                    id,
                    full_name,
                    identifier,
                    avatar_url
                )
            `);

        if (itemId) query = query.eq('item_id', itemId);
        if (courseId) query = query.eq('course_id', courseId);
        if (cohortId && cohortId !== 'null' && cohortId !== 'undefined') {
            // Include submissions for the specific cohort OR those that are global (null)
            query = query.or(`cohort_id.eq.${cohortId},cohort_id.is.null`);
        } else {
            query = query.is('cohort_id', null);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        console.log('Submissions query result:', { count: data?.length, error });

        if (error) {
            console.error('Supabase query error:', error);
            throw error;
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error fetching submissions:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { submissionId, points, feedback, tutorId, status } = body;

        if (!submissionId) {
            return NextResponse.json({ error: 'Missing submissionId' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('assignment_submissions')
            .update({
                status: status || 'graded',
                grade_data: {
                    points,
                    feedback,
                    tutor_id: tutorId,
                    graded_at: new Date().toISOString()
                },
                updated_at: new Date().toISOString()
            })
            .eq('id', submissionId)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error updating submission/grade:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
