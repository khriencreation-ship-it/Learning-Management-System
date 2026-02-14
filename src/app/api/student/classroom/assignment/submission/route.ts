
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const item_id = searchParams.get('assignmentId') || searchParams.get('itemId');
        const cohort_id = searchParams.get('cohortId');

        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);

        if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        if (!item_id) return NextResponse.json({ error: 'Missing item_id' }, { status: 400 });

        let query = supabaseAdmin
            .from('assignment_submissions')
            .select('*')
            .eq('student_id', user.id)
            .eq('item_id', item_id);

        if (cohort_id && cohort_id !== 'null' && cohort_id !== 'undefined') {
            query = query.eq('cohort_id', cohort_id);
        } else {
            query = query.is('cohort_id', null);
        }

        const { data, error } = await query.maybeSingle();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error fetching assignment submission:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
