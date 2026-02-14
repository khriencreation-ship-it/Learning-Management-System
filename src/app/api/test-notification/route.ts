import { NextResponse } from 'next/server';
import { sendNotification } from '@/lib/notifications';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const revalidate = 0;

export async function GET() {
    try {
        // 1. Check if table exists by selecting 1 row
        const { error: selectError } = await supabaseAdmin.from('notifications').select('count').limit(1);

        if (selectError) {
            return NextResponse.json({
                status: 'error',
                step: 'check_table',
                message: 'Notifications table check failed. Does the table exist?',
                details: selectError
            });
        }

        // 2. Try to insert a test notification (fetching a random user first or using a dummy UUID if possible, but better to use a real ID from profiles)
        const { data: profile } = await supabaseAdmin.from('profiles').select('id').limit(1).single();

        if (!profile) {
            return NextResponse.json({ status: 'warning', message: 'No profiles found to test insertion' });
        }

        const success = await sendNotification(
            profile.id,
            'Test Notification',
            'This is a test message to verify database connectivity.',
            'system'
        );

        if (!success) {
            // We need to capture the internal error from sendNotification (it catches it). 
            // Logic in sendNotification logs to console but returns false.
            // I'll manually try insert here to see error.
            const { error: insertError } = await supabaseAdmin
                .from('notifications')
                .insert({
                    user_id: profile.id,
                    title: 'Test Debug',
                    message: 'Debug Message',
                    type: 'system',
                    is_read: false,
                    created_at: new Date().toISOString()
                });

            return NextResponse.json({
                status: 'error',
                step: 'insert_test',
                message: 'Failed to insert notification',
                details: insertError
            });
        }

        return NextResponse.json({ status: 'success', message: 'Notification system is working correctly.' });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
