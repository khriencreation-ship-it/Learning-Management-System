import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const revalidate = 0;

export async function GET() {
    try {
        const { data: cohorts, error } = await supabaseAdmin
            .from('cohorts')
            .select(`
                *,
                cohort_students(count),
                cohort_tutors(count),
                course_cohorts(count)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase error fetching cohorts:', error);
            throw error;
        }

        // Transform if necessary, but Supabase returns JSON that matches our interface mostly
        // Just need to ensure camelCase/snake_case mapping if needed.
        // Our schema uses snake_case (start_date), frontend expects camelCase (startDate)?
        // Let's modify the select to aliases or map it here.

        const formattedCohorts = cohorts.map((c: any) => ({
            id: c.id,
            name: c.name,
            batch: c.batch,
            image: c.image,
            description: c.description,
            startDate: c.start_date, // Map snake_case from DB to camelCase for frontend
            endDate: c.end_date,
            status: c.status,
            // Extract counts from the nested response
            studentsCount: c.cohort_students?.[0]?.count || 0,
            tutorsCount: c.cohort_tutors?.[0]?.count || 0,
            coursesCount: c.course_cohorts?.[0]?.count || 0,
        }));

        return NextResponse.json(formattedCohorts);
    } catch (error: any) {
        console.error('Error fetching cohorts:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch cohorts' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, batch, startDate, endDate, image, description } = body;

        // Basic validation
        if (!name || !batch || !startDate || !endDate) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const now = new Date();
        const start = new Date(startDate);
        const end = new Date(endDate);

        let status = 'upcoming';
        if (now >= start && now <= end) {
            status = 'active';
        } else if (now > end) {
            status = 'completed';
        }

        const { data, error } = await supabaseAdmin
            .from('cohorts')
            .insert([
                {
                    name,
                    batch,
                    image,
                    description,
                    start_date: start,
                    end_date: end,
                    status
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Supabase error creating cohort:', error);
            throw error;
        }

        // Format response to match frontend expectation (camelCase)
        const newCohort = {
            ...data,
            startDate: data.start_date,
            endDate: data.end_date
        };

        return NextResponse.json(
            { message: 'Cohort created successfully', cohort: newCohort },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error creating cohort:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

