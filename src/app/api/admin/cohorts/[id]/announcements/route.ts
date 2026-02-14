
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const revalidate = 0;

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const { data, error } = await supabaseAdmin
            .from('announcements')
            .select('*')
            .eq('cohort_id', id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching cohort announcements:', error);
            throw error;
        }

        const broadcasts = data.map((item: any) => ({
            ...item,
            sender_role: item.sender_id ? 'tutor' : 'admin'
        }));

        return NextResponse.json(broadcasts);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
