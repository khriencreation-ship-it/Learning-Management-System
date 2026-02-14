import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { supabase } from '@/lib/supabase';

export const revalidate = 0;

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: courseId } = await params;

        // Authenticate user
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);

        if (userError || !user || user.user_metadata?.role !== 'tutor') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch assignments for this course
        // Assignments are module_items with type 'assignment'
        const { data: modules } = await supabaseAdmin
            .from('course_modules')
            .select('id')
            .eq('course_id', courseId);

        if (!modules || modules.length === 0) {
            return NextResponse.json([]);
        }

        const moduleIds = modules.map(m => m.id);

        const { data: assignments, error } = await supabaseAdmin
            .from('module_items')
            .select(`
                *,
                module:course_modules(title)
            `)
            .in('module_id', moduleIds)
            .eq('type', 'assignment')
            .order('order_index', { ascending: true });

        if (error) throw error;

        // Format for frontend
        const formattedAssignments = assignments?.map(a => ({
            id: a.id,
            title: a.title,
            moduleTitle: a.module?.title,
            summary: a.summary,
            totalPoints: a.metadata?.totalPoints || 0,
            dueDate: a.metadata?.closeDate,
            createdAt: a.created_at
        })) || [];

        return NextResponse.json(formattedAssignments);

    } catch (error: any) {
        console.error('Error fetching tutor assignments:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
