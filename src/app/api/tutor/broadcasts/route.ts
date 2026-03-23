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

        // 1. Fetch Tutors' Cohorts
        const { data: cohortTutors } = await supabaseAdmin
            .from('cohort_tutors')
            .select('cohort_id')
            .eq('tutor_id', tutorId);
        
        const myCohortIds = cohortTutors?.map(ct => ct.cohort_id) || [];

        // 2. Fetch Tutors' Courses
        // Direct assignment
        const { data: ctData } = await supabaseAdmin
            .from('course_tutors')
            .select('course_id')
            .eq('tutor_id', tutorId);
        
        const myCourseIds = new Set(ctData?.map(item => item.course_id) || []);

        // Name match assignment (tutor full_name matches course instructor)
        const { data: profile } = await supabaseAdmin.from('profiles').select('full_name').eq('id', tutorId).single();
        if (profile?.full_name) {
            const { data: instructorCourses } = await supabaseAdmin
                .from('courses')
                .select('id')
                .eq('instructor', profile.full_name);
            instructorCourses?.forEach(item => myCourseIds.add(item.id));
        }

        const courseIdsArray = Array.from(myCourseIds);

        // 3. Fetch Broadcasts
        // (Own broadcasts OR target cohort match OR target course match)
        let query = supabaseAdmin
            .from('announcements')
            .select(`
                *,
                cohorts ( name ),
                courses ( title )
            `)
            .order('created_at', { ascending: false });

        const conditions = [`sender_id.eq.${tutorId}`];
        if (myCohortIds.length > 0) {
            conditions.push(`cohort_id.in.(${myCohortIds.join(',')})`);
        }
        if (courseIdsArray.length > 0) {
            conditions.push(`course_id.in.(${courseIdsArray.join(',')})`);
        }

        query = query.or(conditions.join(','));

        const { data, error } = await query;
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
            sender_role: item.sender_id === tutorId ? 'tutor' : 'admin'
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
