import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendNotification } from '@/lib/notifications';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('query') || '';
        const status = searchParams.get('status') || '';
        const instructor = searchParams.get('instructor') || '';

        let supabaseQuery = supabaseAdmin
            .from('courses')
            .select('*, course_cohorts(count)')
            .order('created_at', { ascending: false });

        if (query) {
            supabaseQuery = supabaseQuery.or(`title.ilike.%${query}%,code.ilike.%${query}%,instructor.ilike.%${query}%`);
        }

        if (status && status !== 'all') {
            supabaseQuery = supabaseQuery.eq('status', status);
        }

        if (instructor && instructor !== 'all') {
            supabaseQuery = supabaseQuery.eq('instructor', instructor);
        }

        const { data: courses, error } = await supabaseQuery;

        if (error) {
            console.error('Supabase error fetching courses:', error);
            throw error;
        }

        return NextResponse.json(courses.map((c: any) => ({
            ...c,
            cohortsCount: c.course_cohorts?.[0]?.count || 0
        })));
    } catch (error) {
        console.error('Error fetching courses:', error);
        return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, instructor, image } = body;
        let { code, description } = body;

        // Validation - Minimal required
        if (!title || !instructor) {
            return NextResponse.json(
                { error: 'Missing required title or instructor' },
                { status: 400 }
            );
        }

        // Auto-generate code if missing
        if (!code) {
            const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            code = `C-${Date.now().toString().slice(-4)}-${randomSuffix}`;
        }

        // Default description
        if (!description) description = '';

        const { data: newCourse, error } = await supabaseAdmin
            .from('courses')
            .insert([
                {
                    title,
                    code,
                    instructor,
                    description,
                    image: image || '',
                    status: 'draft',
                    topics_count: 0,
                    lessons_count: 0,
                    quizzes_count: 0,
                    assignments_count: 0
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Supabase error creating course:', error);
            throw error;
        }

        // Notify Instructor Logic
        if (instructor) {
            const { data: profile } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .eq('full_name', instructor)
                .single();

            if (profile) {
                await sendNotification(
                    profile.id,
                    'Course Assigned',
                    `You have been assigned as instructor for the course: ${title}`,
                    'assignment'
                );
            }
        }

        return NextResponse.json(newCourse, { status: 201 });

    } catch (error: any) {
        console.error('Error creating course:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create course' },
            { status: 500 }
        );
    }
}
