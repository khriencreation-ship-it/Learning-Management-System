import { supabaseAdmin } from './supabase-admin';

export type NotificationType = 'assignment' | 'broadcast' | 'system';

export async function sendNotification(
    userId: string,
    title: string,
    message: string,
    type: NotificationType
) {
    try {
        const { error } = await supabaseAdmin
            .from('notifications')
            .insert({
                user_id: userId,
                title,
                message,
                type,
                is_read: false,
                created_at: new Date().toISOString()
            });

        if (error) {
            console.error('Error sending notification:', error);
            return false;
        }
        return true;
    } catch (error) {
        console.error('Exception sending notification:', error);
        return false;
    }
}
