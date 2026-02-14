import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // 1. Fetch User to determine role
        const { data: { user }, error: fetchError } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (fetchError || !user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const role = user.user_metadata?.role || 'student';
        const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

        // 2. Generate new random password
        // Format: Khrien + Random(4 chars) + Role + !
        // e.g. KhrienXy9zStudent!
        const randomPart = Math.random().toString(36).slice(-4);
        const newPassword = `Khrien${randomPart}${roleLabel}!`;

        // 3. Update Auth User Password
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            password: newPassword,
            user_metadata: {
                ...user.user_metadata,
                initial_password: newPassword, // Store new password as initial_password for display
                force_change_password: true    // Force change on next login
            }
        });

        if (updateError) {
            console.error('Error updating password:', updateError);
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        // 3. Return the new password
        return NextResponse.json({
            success: true,
            message: 'Password reset successfully',
            newPassword: newPassword
        });

    } catch (error: any) {
        console.error('Password reset error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
