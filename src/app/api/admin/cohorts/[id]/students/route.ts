import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        // Fetch students in this cohort via cohort_students
        const { data: cohortStudents, error } = await supabaseAdmin
            .from('cohort_students')
            .select(`
                student_id,
                profiles (
                    id,
                    full_name,
                    identifier,
                    avatar_url
                )
            `)
            .eq('cohort_id', id);

        if (error) {
            console.error('Error fetching cohort students:', error);
            throw new Error(error.message);
        }

        // Flatten the structure for the frontend
        const students = cohortStudents.map((cs: any) => ({
            id: cs.student_id,
            profile: cs.profiles // Keep 'profile' key to match EnrollmentModal expectation
        }));

        return NextResponse.json({ students });
    } catch (error: any) {
        console.error('Error in GET /api/admin/cohorts/[id]/students:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
