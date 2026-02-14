
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const userId = id;

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        // 1. Delete Profile First (to avoid FK constraints if cascade isn't set)
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .delete()
            .eq('id', userId);

        if (profileError) {
            console.error('Error deleting profile:', profileError);
            // Verify if it's just not found (already deleted), if so continue
            // But for now, let's assume if it fails, we stop, unless we want to force auth delete
        }

        // 2. Delete from Auth
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (authError) {
            // If user is already gone, treat as success (idempotent)
            if (authError.message.includes('User not found') || authError.status === 404) {
                console.log('User already deleted from Auth, continuing.');
            } else {
                console.error('Error deleting auth user:', authError);
                return NextResponse.json({ error: authError.message }, { status: 500 });
            }
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const userId = id;
        const body = await req.json();
        const { fullName, phone, password } = body; // Can update password here too if needed

        const updates: any = {};
        if (fullName) updates.full_name = fullName;
        if (phone !== undefined) updates.phone_number = phone;

        // Update Profile
        if (Object.keys(updates).length > 0) {
            const { error } = await supabaseAdmin
                .from('profiles')
                .update(updates)
                .eq('id', userId);

            if (error) throw error;
        }

        // Update Auth (Password)
        if (password) {
            const { error: passError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
                password: password,
                user_metadata: { initial_password: password } // Update the display password too
            });
            if (passError) throw passError;
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
