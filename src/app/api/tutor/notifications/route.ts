import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { supabase } from '@/lib/supabase';

export const revalidate = 0;

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);

        if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Lazy Cleanup: Delete notifications older than 24 hours
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        await supabaseAdmin
            .from('notifications')
            .delete()
            .lt('created_at', oneDayAgo)
            .eq('user_id', user.id); // Only delete for this user or global? 
        // Better to delete per user access to distribute load or global if efficient index.
        // Let's stick to safe user-scoped delete or global if backend admin allows.
        // actually user scoped is safer logic-wise here to avoid locking issues on massive table, 
        // though global cleanup is cleaner. Let's do user scoped for now as we are in user context.

        const { data: notifications, error } = await supabaseAdmin
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) throw error;

        return NextResponse.json(notifications);
    } catch (error: any) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);

        if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { notificationId } = body;

        if (notificationId) {
            // Mark specific as read
            await supabaseAdmin
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notificationId)
                .eq('user_id', user.id);
        } else {
            // Mark all as read
            await supabaseAdmin
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', user.id);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error updating notification:', error);
        return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
    }
}
