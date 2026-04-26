import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const revalidate = 0;

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '25');
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status') || 'all';
        
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = supabaseAdmin
            .from('profiles')
            .select('*', { count: 'exact' })
            .eq('role', 'student');

        if (search) {
            query = query.or(`full_name.ilike.%${search}%,username.ilike.%${search}%,identifier.ilike.%${search}%`);
        }

        if (status && status !== 'all') {
            query = query.eq('payment_status', status);
        }

        const { data: students, error, count } = await query
            .order('updated_at', { ascending: false })
            .range(from, to);

        if (error) {
            console.error('Supabase error fetching students:', error);
            throw error;
        }

        const formattedStudents = (students || []).map((s: any) => ({
            id: s.id,
            name: s.full_name,
            studentId: s.identifier,
            email: s.username,
            phone: s.phone_number,
            paymentStatus: s.payment_status,
            status: s.status
        }));

        return NextResponse.json({ 
            students: formattedStudents, 
            totalCount: count || 0 
        });
    } catch (error) {
        console.error('Error fetching students:', error);
        return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
    }
}

