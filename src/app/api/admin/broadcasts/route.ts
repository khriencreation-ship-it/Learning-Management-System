import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendNotification } from '@/lib/notifications';

export const revalidate = 0;

export async function GET() {
    try {
        // Fetch announcements with joined cohort and course data
        const { data, error } = await supabaseAdmin
            .from('announcements')
            .select(`
                *,
                cohorts ( name ),
                courses ( title )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase error fetching broadcasts:', error);
            throw error;
        }

        // Map for easier consumption
        const broadcasts = data.map((item: any) => ({
            id: item.id,
            title: item.title,
            message: item.message,
            target_type: item.target_type, // 'cohort' or 'course'
            cohort_id: item.cohort_id,
            course_id: item.course_id,
            created_at: item.created_at,
            cohort_name: item.cohorts?.name,
            course_title: item.courses?.title,
            sender_role: item.sender_id ? 'tutor' : 'admin'
        }));

        return NextResponse.json(broadcasts);
    } catch (error: any) {
        console.error('Error fetching broadcasts:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch broadcasts' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, message, cohort_id, course_id, target_type } = body;

        if (!title || !message || !cohort_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const payload = {
            title,
            message,
            cohort_id,
            course_id: target_type === 'course' ? course_id : null,
            target_type: target_type || 'cohort',
            sender_id: null,
            created_at: new Date().toISOString()
        };

        const { data, error } = await supabaseAdmin
            .from('announcements')
            .insert(payload)
            .select()
            .single();

        if (error) {
            console.error('Supabase error creating broadcast:', error);
            throw error;
        }

        // Send Notifications based on Target
        // We do this asynchronously/background
        (async () => {
            const targetUserIds = new Set<string>();

            if (target_type === 'cohort' && cohort_id) {
                // Get all tutors assigned to this cohort
                const { data: tutors } = await supabaseAdmin
                    .from('cohort_tutors')
                    .select('tutor_id')
                    .eq('cohort_id', cohort_id);

                tutors?.forEach(t => targetUserIds.add(t.tutor_id));

                // Get all students in this cohort
                const { data: students } = await supabaseAdmin
                    .from('cohort_students')
                    .select('student_id')
                    .eq('cohort_id', cohort_id);

                students?.forEach(s => targetUserIds.add(s.student_id));

            } else if (target_type === 'course' && course_id) {
                // Get course instructor(s)
                const { data: tutors } = await supabaseAdmin
                    .from('course_tutors')
                    .select('tutor_id')
                    .eq('course_id', course_id);

                tutors?.forEach(t => targetUserIds.add(t.tutor_id));

                // Get all students enrolled in this course for this cohort
                const { data: students } = await supabaseAdmin
                    .from('course_enrollments')
                    .select('student_id')
                    .eq('course_id', course_id)
                    .eq('cohort_id', cohort_id);

                students?.forEach(s => targetUserIds.add(s.student_id));
            }

            // Send to all unique users
            const notificationPromises = Array.from(targetUserIds).map(userId =>
                sendNotification(
                    userId,
                    `New Announcement: ${title}`,
                    `${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`,
                    'broadcast',
                    target_type === 'course' ? `/student/courses/${course_id}?cohortId=${cohort_id}` : undefined
                )
            );

            await Promise.all(notificationPromises);
        })().catch(err => console.error('Error sending broadcast notifications:', err));

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error creating broadcast:', error);
        return NextResponse.json({ error: error.message || 'Failed to create broadcast' }, { status: 500 });
    }
}
