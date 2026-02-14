import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { studentIds } = body;

        if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            return NextResponse.json(
                { error: 'No students selected' },
                { status: 400 }
            );
        }

        // Check for existing enrollments to avoid duplicates
        const { data: existing } = await supabaseAdmin
            .from('cohort_students')
            .select('student_id')
            .eq('cohort_id', id)
            .in('student_id', studentIds);

        const existingIds = new Set(existing?.map(e => e.student_id) || []);
        const newStudentIds = studentIds.filter(sid => !existingIds.has(sid));

        if (newStudentIds.length === 0) {
            return NextResponse.json({ success: true, message: 'All selected students are already enrolled' });
        }

        // Prepare inserts for NEW students only
        const inserts = newStudentIds.map(studentId => ({
            cohort_id: id,
            student_id: studentId,
            start_date: new Date().toISOString()
        }));

        const { error } = await supabaseAdmin
            .from('cohort_students')
            .insert(inserts);

        if (error) throw error;

        // FUTURE: Here we could optionally auto-enroll students in specific courses
        // For now, we strictly follow the "cherry-pick" rule, so we do NOT create course_enrollments here.

        return NextResponse.json({ success: true, message: 'Students enrolled successfully' });
    } catch (error: any) {
        console.error('Error enrolling students:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to enroll students' },
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
        const { studentId } = body;

        if (!studentId) {
            return NextResponse.json(
                { error: 'Student ID is required' },
                { status: 400 }
            );
        }

        // 1. Remove from cohort
        const { error: cohortError } = await supabaseAdmin
            .from('cohort_students')
            .delete()
            .eq('cohort_id', id)
            .eq('student_id', studentId);

        if (cohortError) throw cohortError;

        // 2. Unenroll from all courses in this cohort
        const { error: enrollError } = await supabaseAdmin
            .from('course_enrollments')
            .delete()
            .eq('cohort_id', id)
            .eq('student_id', studentId);

        if (enrollError) {
            console.error('Error unenrolling from courses:', enrollError);
            // We continue as the primary action (cohort removal) succeeded
        }

        // 3. Clear activity data for this cohort
        // We delete from these tables strictly by cohort_id and student_id
        const cleanupPromises = [
            supabaseAdmin.from('assignment_submissions').delete().eq('cohort_id', id).eq('student_id', studentId),
            supabaseAdmin.from('quiz_submissions').delete().eq('cohort_id', id).eq('student_id', studentId),
            supabaseAdmin.from('student_progress').delete().eq('cohort_id', id).eq('student_id', studentId)
        ];

        const results = await Promise.all(cleanupPromises);
        results.forEach((res, index) => {
            if (res.error) {
                console.error(`Error cleaning up table ${index}:`, res.error);
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Student removed from cohort and all associated course data cleared'
        });
    } catch (error: any) {
        console.error('Error unenrolling student:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to unenroll student' },
            { status: 500 }
        );
    }
}

