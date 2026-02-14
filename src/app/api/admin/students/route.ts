import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const revalidate = 0;

export async function GET() {
    try {
        const { data: students, error } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('role', 'student');

        if (error) {
            console.error('Supabase error fetching students:', error);
            throw error;
        }

        const formattedStudents = students.map((s: any) => ({
            id: s.id,
            name: s.full_name,
            studentId: s.identifier,
            email: s.username,
            phone: s.phone_number,
            paymentStatus: s.payment_status,
            status: s.status
        }));

        return NextResponse.json(formattedStudents);
    } catch (error) {
        console.error('Error fetching students:', error);
        return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
    }
}

