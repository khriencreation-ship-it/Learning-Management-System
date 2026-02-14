
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const revalidate = 0;

export async function GET() {
    try {
        const { data: admins, error } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .in('role', ['admin', 'sub-admin']);

        if (error) {
            console.error('Supabase error fetching sub-admins:', error);
            throw error;
        }

        const formattedAdmins = admins.map((t: any) => ({
            id: t.id,
            name: t.full_name || 'Unknown User',
            email: t.username || t.identifier || 'No Email',
            identifier: t.identifier, // Crucial for identifying Super Admin
            phone: t.phone_number,
            status: t.status,
            role: t.role,
            createdAt: t.updated_at || ''
        }));

        return NextResponse.json(formattedAdmins);
    } catch (error) {
        console.error('Error fetching sub-admins:', error);
        return NextResponse.json({ error: 'Failed to fetch sub-admins' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, password, fullName, phone } = body;

        console.log('[API] Creating Sub Admin:', { email, fullName, phone, passwordLength: password?.length });

        if (!email || !password || !fullName) {
            console.log('[API] Missing fields');
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Create Auth User
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                full_name: fullName,
                role: 'admin',
                initial_password: password
            }
        });

        if (authError) {
            console.error('[API] Auth creation error object:', JSON.stringify(authError, null, 2));
            return NextResponse.json({ error: authError.message, details: authError }, { status: 400 });
        }

        if (!authUser.user) throw new Error('Failed to create auth user');

        // 2. Create Profile (if not created by trigger)
        // Check if trigger created it first
        const { data: existingProfile } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', authUser.user.id)
            .single();

        let profileError;

        if (existingProfile) {
            // Update existing
            const { error } = await supabaseAdmin
                .from('profiles')
                .update({
                    full_name: fullName,
                    username: email,
                    role: 'admin',
                    phone_number: phone || null,
                    status: 'active'
                })
                .eq('id', authUser.user.id);
            profileError = error;
        } else {
            // Insert new
            const { error } = await supabaseAdmin
                .from('profiles')
                .insert({
                    id: authUser.user.id,
                    full_name: fullName,
                    username: email,
                    role: 'admin',
                    phone_number: phone || null,
                    status: 'active'
                });
            profileError = error;
        }

        if (profileError) {
            // Rollback Auth if profile fails? 
            // Ideally yes, but for now just report error.
            console.error('Profile creation error:', profileError);
            // Attempt to clean up auth user
            await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
            return NextResponse.json({ error: 'Failed to create profile: ' + profileError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, user: authUser.user }, { status: 201 });

    } catch (error: any) {
        console.error('Error creating sub-admin:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
