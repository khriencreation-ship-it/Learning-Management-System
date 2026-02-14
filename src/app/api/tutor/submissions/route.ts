
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const itemId = searchParams.get('itemId');
        const courseId = searchParams.get('courseId');
        const cohortId = searchParams.get('cohortId');

        if (!itemId && !courseId && !cohortId) { // Adjusted condition to include cohortId
            return NextResponse.json({ error: 'Missing itemId, courseId, or cohortId' }, { status: 400 });
        }

        let query = supabaseAdmin
            .from('assignment_submissions')
            .select(`
                *,
                student:student_id (
                    id,
                    full_name,
                    identifier,
                    avatar_url
                )
            `);

        if (itemId) query = query.eq('item_id', itemId);
        if (courseId) query = query.eq('course_id', courseId);
        if (cohortId && cohortId !== 'all') query = query.eq('cohort_id', cohortId);

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

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
