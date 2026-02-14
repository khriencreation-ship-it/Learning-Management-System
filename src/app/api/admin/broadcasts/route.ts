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
            const targetTutorIds = new Set<string>();

            if (target_type === 'cohort' && cohort_id) {
                // Get all tutors assigned to this cohort
                const { data: tutors } = await supabaseAdmin
                    .from('cohort_tutors')
                    .select('tutor_id')
                    .eq('cohort_id', cohort_id);

                tutors?.forEach(t => targetTutorIds.add(t.tutor_id));
            } else if (target_type === 'course' && course_id) {
                // Get course instructor(s)
                const { data: tutors } = await supabaseAdmin
                    .from('course_tutors')
                    .select('tutor_id')
                    .eq('course_id', course_id);

                if (tutors && tutors.length > 0) {
                    tutors.forEach(t => targetTutorIds.add(t.tutor_id));
                } else {
                    // Fallback to name match for legacy courses
                    const { data: course } = await supabaseAdmin.from('courses').select('instructor').eq('id', course_id).single();
                    if (course?.instructor) {
                        const { data: profile } = await supabaseAdmin.from('profiles').select('id').eq('full_name', course.instructor).single();
                        if (profile) targetTutorIds.add(profile.id);
                    }
                }
            }

            // Send to all unique tutors
            const notificationPromises = Array.from(targetTutorIds).map(userId =>
                sendNotification(
                    userId,
                    `New Broadcast: ${title}`,
                    `New announcement for ${target_type}: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`,
                    'broadcast'
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
