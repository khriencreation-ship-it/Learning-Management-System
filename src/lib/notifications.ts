import { supabaseAdmin } from './supabase-admin';

export type NotificationType = 'assignment' | 'broadcast' | 'system' | 'enrollment' | 'grading' | 'content' | 'deadline';

export async function sendNotification(
    userId: string,
    title: string,
    message: string,
    type: NotificationType,
    link?: string
) {
    try {
        const { error } = await supabaseAdmin
            .from('notifications')
            .insert({
                user_id: userId,
                title,
                message,
                type,
                link,
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
