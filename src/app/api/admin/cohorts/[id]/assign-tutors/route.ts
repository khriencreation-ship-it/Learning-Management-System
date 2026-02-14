import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendNotification } from '@/lib/notifications';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { tutorIds } = body;

        if (!tutorIds || !Array.isArray(tutorIds) || tutorIds.length === 0) {
            return NextResponse.json(
                { error: 'No tutors selected' },
                { status: 400 }
            );
        }

        // Check for existing tutor assignments
        const { data: existing } = await supabaseAdmin
            .from('cohort_tutors')
            .select('tutor_id')
            .eq('cohort_id', id)
            .in('tutor_id', tutorIds);

        const existingIds = new Set(existing?.map(e => e.tutor_id) || []);
        const newTutorIds = tutorIds.filter(tid => !existingIds.has(tid));

        if (newTutorIds.length === 0) {
            return NextResponse.json({ success: true, message: 'All selected tutors are already assigned' });
        }

        // Prepare inserts for NEW assignments only
        const inserts = newTutorIds.map(tutorId => ({
            cohort_id: id,
            tutor_id: tutorId
            // No timestamp column in schema for cohort_tutors
        }));

        const { error } = await supabaseAdmin
            .from('cohort_tutors')
            .insert(inserts);

        if (error) throw error;

        // Notify Tutors (Background/Async)
        // Fetch cohort name for message
        const { data: cohort } = await supabaseAdmin.from('cohorts').select('name').eq('id', id).single();
        const cohortName = cohort?.name || 'a new cohort';

        await Promise.all(newTutorIds.map(tutorId =>
            sendNotification(
                tutorId,
                'New Cohort Assignment',
                `You have been assigned to cohort: ${cohortName}`,
                'assignment'
            )
        ));

        return NextResponse.json({ success: true, message: 'Tutors assigned successfully' });
    } catch (error: any) {
        console.error('Error assigning tutors:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to assign tutors' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { tutorId } = body;

        if (!tutorId) {
            return NextResponse.json(
                { error: 'Tutor ID is required' },
                { status: 400 }
            );
        }

        const { error } = await supabaseAdmin
            .from('cohort_tutors')
            .delete()
            .eq('cohort_id', id)
            .eq('tutor_id', tutorId);

        if (error) throw error;

        return NextResponse.json({ success: true, message: 'Tutor removed from cohort successfully' });
    } catch (error: any) {
        console.error('Error removing tutor:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to remove tutor' },
            { status: 500 }
        );
    }
}
