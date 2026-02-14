import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const revalidate = 0; // Always fresh

export async function GET() {
    try {
        const { data: tutors, error } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('role', 'tutor');

        if (error) {
            console.error('Supabase error fetching tutors:', error);
            throw error;
        }

        const formattedTutors = tutors.map((t: any) => ({
            id: t.id,
            name: t.full_name,
            email: t.username // Using username as email placeholder/store
        }));

        return NextResponse.json(formattedTutors);
    } catch (error) {
        console.error('Error fetching tutors:', error);
        return NextResponse.json({ error: 'Failed to fetch tutors' }, { status: 500 });
    }
}

