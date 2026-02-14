import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const revalidate = 0;

export async function GET() {
    try {
        // Method 1: Try to select from the table directly
        const { error: selectError } = await supabaseAdmin
            .from('media_folders')
            .select('id')
            .limit(1);

        // Method 2: List all public tables via RPC (if you had one) or usually we can't query info_schema via client directly unless exposed.
        // However, we can try to infer from the error.

        if (selectError) {
            return NextResponse.json({
                status: 'ERROR',
                message: 'Table media_folders CANNOT be accessed.',
                details: selectError.message,
                hint: selectError.message.includes('relation')
                    ? 'The table does not exist. You likely ran the SQL file when it was empty. Please run it again.'
                    : 'Permission denied or other error.'
            });
        }

        return NextResponse.json({
            status: 'SUCCESS',
            message: 'Table media_folders exists and is accessible!'
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message });
    }
}
