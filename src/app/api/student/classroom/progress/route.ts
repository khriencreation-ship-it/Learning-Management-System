
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const courseId = searchParams.get('courseId');
        const cohortId = searchParams.get('cohortId');

        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);

        if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        if (!courseId) return NextResponse.json({ error: 'Missing courseId' }, { status: 400 });

        let query = supabaseAdmin
            .from('student_progress')
            .select('item_id, is_completed, completed_at')
            .eq('student_id', user.id)
            .eq('course_id', courseId);

        if (cohortId && cohortId !== 'null' && cohortId !== 'undefined') {
            query = query.eq('cohort_id', cohortId);
        } else {
            query = query.is('cohort_id', null);
        }

        const { data, error } = await query;

        if (error) {
            // Table might not exist yet, treat as empty
            console.warn('Error fetching progress (table might vary):', error.message);
            return NextResponse.json([]);
        }

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { courseId, itemId, isCompleted, cohortId } = body;

        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);

        if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Upsert progress
        const { data, error } = await supabaseAdmin
            .from('student_progress')
            .upsert({
                student_id: user.id,
                course_id: courseId,
                cohort_id: cohortId || null,
                item_id: itemId,
                is_completed: isCompleted,
                completed_at: isCompleted ? new Date().toISOString() : null,
                updated_at: new Date().toISOString()
            }, { onConflict: 'student_id, item_id, cohort_id' })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);

    } catch (error: any) {
        console.error('Error saving progress:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
