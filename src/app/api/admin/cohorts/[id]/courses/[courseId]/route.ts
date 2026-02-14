import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string; courseId: string }> }
) {
    try {
        const { id, courseId } = await params;
        const body = await request.json();
        const { settings } = body;

        if (!settings) {
            return NextResponse.json(
                { error: 'Settings object is required' },
                { status: 400 }
            );
        }

        const { data, error } = await supabaseAdmin
            .from('course_cohorts')
            .update({ settings })
            .eq('cohort_id', id)
            .eq('course_id', courseId)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error('Error updating course settings:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update settings' },
            { status: 500 }
        );
    }
}
