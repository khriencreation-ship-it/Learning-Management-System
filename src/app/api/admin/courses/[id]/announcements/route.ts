
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { data: announcements, error } = await supabaseAdmin
            .from('announcements')
            .select('*')
            .eq('course_id', id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const broadcasts = announcements.map((item: any) => ({
            ...item,
            sender_role: item.sender_id ? 'tutor' : 'admin'
        }));

        return NextResponse.json(broadcasts);
    } catch (error: any) {
        console.error('Error fetching announcements:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { title, content } = body;

        const { data, error } = await supabaseAdmin
            .from('announcements')
            .insert({
                course_id: id,
                title,
                message: content,
                target_type: 'course',
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error creating announcement:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
