import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const { password } = await request.json();
        const authorization = request.headers.get('Authorization');

        if (!authorization) {
            return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
        }

        const token = authorization.replace('Bearer ', '');

        // Verify the user session using the token
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);

        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
        }

        const userId = user.id;

        // 1. Update Password using Admin Client (bypasses potential RLS or self-update restrictions if any)
        // Note: Using Admin client to update password ensures it works regardless of user permissions,
        // but traditionally users updates their own password via `supabase.auth.updateUser`.
        // However, since we are here, we can use admin to be sure.
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            {
                password: password,
                user_metadata: {
                    ...user.user_metadata,
                    force_change_password: false,
                    initial_password: null
                }
            }
        );

        if (updateError) {
            throw updateError;
        }

        // Return success
        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Change password error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
