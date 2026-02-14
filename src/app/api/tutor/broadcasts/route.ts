import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { supabase } from '@/lib/supabase';
import { sendNotification } from '@/lib/notifications';

export const revalidate = 0;

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);
        if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const tutorId = user.id;

        // Fetch broadcasts sent by this tutor
        const { data, error } = await supabaseAdmin
            .from('announcements')
            .select(`
                *,
                cohorts ( name ),
                courses ( title )
            `)
            .eq('sender_id', tutorId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const broadcasts = data.map((item: any) => ({
            id: item.id,
            title: item.title,
            message: item.message,
            target_type: item.target_type,
            cohort_id: item.cohort_id,
            course_id: item.course_id,
            created_at: item.created_at,
            cohort_name: item.cohorts?.name,
            course_title: item.courses?.title,
            sender_role: 'tutor'
        }));

        return NextResponse.json(broadcasts);
    } catch (error: any) {
        console.error('Error fetching tutor broadcasts:', error);
        return NextResponse.json({ error: 'Failed to fetch broadcasts' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);
        if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const tutorId = user.id;
        const body = await request.json();
        const { title, message, cohort_id, course_id } = body;

        if (!title || !message || !cohort_id || !course_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // --- Security Check: Is this tutor assigned to this course? ---
        // 1. Check direct assignment
        const { data: directMatch } = await supabaseAdmin
            .from('course_tutors')
            .select('id')
            .eq('tutor_id', tutorId)
            .eq('course_id', course_id)
            .single();

        let isAssigned = !!directMatch;

        // 2. Check name match (legacy)
        if (!isAssigned) {
            const { data: tutorProfile } = await supabaseAdmin
                .from('profiles')
                .select('full_name')
                .eq('id', tutorId)
                .single();

            if (tutorProfile?.full_name) {
                const { data: courseMatch } = await supabaseAdmin
                    .from('courses')
                    .select('id')
                    .eq('instructor', tutorProfile.full_name)
                    .eq('id', course_id)
                    .single();

                if (courseMatch) isAssigned = true;
            }
        }

        if (!isAssigned) {
            return NextResponse.json({ error: 'You are not assigned to this course' }, { status: 403 });
        }

        const payload = {
            title,
            message,
            cohort_id,
            course_id,
            target_type: 'course', // Tutors can only send to specific courses
            sender_id: tutorId,
            created_at: new Date().toISOString()
        };

        const { data, error } = await supabaseAdmin
            .from('announcements')
            .insert(payload)
            .select()
            .single();

        if (error) throw error;

        // --- Notification Logic ---
        // In a real app, we might notify all students in the course/cohort
        // For now, let's keep it simple and just return success.

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error creating tutor broadcast:', error);
        return NextResponse.json({ error: error.message || 'Failed to send broadcast' }, { status: 500 });
    }
}
