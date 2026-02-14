import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { courseId } = body;

        if (!courseId) {
            return NextResponse.json(
                { error: 'Course ID is required' },
                { status: 400 }
            );
        }

        const { error } = await supabaseAdmin
            .from('course_cohorts')
            .delete()
            .eq('cohort_id', id)
            .eq('course_id', courseId);

        if (error) throw error;

        return NextResponse.json({ success: true, message: 'Course removed from cohort successfully' });
    } catch (error: any) {
        console.error('Error removing course:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to remove course' },
            { status: 500 }
        );
    }
}
