import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role');
        const query = searchParams.get('query') || '';

        let supabaseQuery = supabaseAdmin
            .from('profiles')
            .select('*');

        if (role) {
            supabaseQuery = supabaseQuery.eq('role', role);
        }

        if (query) {
            // search on full_name or identifier
            supabaseQuery = supabaseQuery.or(`full_name.ilike.%${query}%,identifier.ilike.%${query}%`);
        }

        const { data: users, error } = await supabaseQuery;

        if (error) {
            console.error('Supabase error fetching users:', error);
            throw error;
        }

        // Map Supabase profile fields to desired JSON output
        const formattedUsers = users.map((user: any) => ({
            id: user.id,
            name: user.full_name,
            email: user.username,
            identifier: user.identifier,
            profilePicture: user.avatar_url,
            role: user.role,
            status: user.status,
            phone: user.phone_number,
            paymentStatus: user.payment_status
        }));

        return NextResponse.json(formattedUsers);
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, studentId, tutorId, role, password, phone, paymentStatus } = body;

        const identifier = role === 'student' ? studentId : tutorId;

        // Determine default password based on role
        let defaultPassword = 'KhrienStudent123!'; // Fallback
        if (role === 'student') {
            defaultPassword = 'KhrienStudent123!';
        } else if (role === 'tutor') {
            defaultPassword = 'KhrienTutor123!';
        }

        const finalPassword = password || defaultPassword;

        // 1. Create user in Auth
        const { data, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: finalPassword,
            email_confirm: true,
            user_metadata: {
                full_name: name,
                role: role,
                identifier: identifier,
                initial_password: finalPassword,
                force_change_password: true
            }
        });

        if (authError) {
            console.error('Auth Error:', authError);
            return NextResponse.json({ error: authError.message }, { status: 400 });
        }

        const user = data.user;

        // 2. Update Profile with additional fields (phone, paymentStatus)
        // Note: The trigger handle_new_user already created the basic profile.
        // We just need to update it with the extra fields.
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({
                phone_number: phone,
                payment_status: paymentStatus,
                username: email // Storing email in username for consistency with other parts of the app
            })
            .eq('id', user.id);

        if (profileError) {
            console.error('Profile Update Error:', profileError);
            // We don't necessarily want to fail here if the user was created, 
            // but it's good to know.
        }

        return NextResponse.json({
            id: user.id,
            message: `${role.charAt(0).toUpperCase() + role.slice(1)} created successfully`
        });

    } catch (error) {
        console.error('POST Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, name, email, studentId, tutorId, role, phone, paymentStatus } = body;

        if (!id) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const identifier = role === 'student' ? studentId : tutorId;

        // 1. Update Auth data (email and name in metadata)
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
            id,
            {
                email,
                user_metadata: {
                    full_name: name,
                    identifier: identifier,
                    role: role
                }
            }
        );

        if (authError) {
            console.error('Auth Update Error:', authError);
            return NextResponse.json({ error: authError.message }, { status: 400 });
        }

        // 2. Update Profile data
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({
                full_name: name,
                username: email,
                identifier: identifier,
                phone_number: phone,
                payment_status: paymentStatus
            })
            .eq('id', id);

        if (profileError) {
            console.error('Profile Update Error:', profileError);
            return NextResponse.json({ error: profileError.message }, { status: 400 });
        }

        return NextResponse.json({
            message: `${role.charAt(0).toUpperCase() + role.slice(1)} updated successfully`
        });

    } catch (error) {
        console.error('PUT Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    console.log('--- DELETE REQUEST RECEIVED ---');
    console.log('Method:', request.method);
    console.log('URL:', request.nextUrl.toString());

    try {
        const id = request.nextUrl.searchParams.get('id')?.trim();

        console.log('Extracted ID:', id);

        if (!id || id === 'undefined' || id === 'null' || id.length < 10) {
            console.error('Invalid ID provided:', id);
            return NextResponse.json({ error: 'Valid User ID is required' }, { status: 400 });
        }

        // 1. Manual cleanup of potential blocking tables just in case
        console.log(`Phase 1: Manual cleanup for student_id: ${id}`);
        try {
            await Promise.all([
                supabaseAdmin.from('course_enrollments').delete().eq('student_id', id),
                supabaseAdmin.from('cohort_students').delete().eq('student_id', id),
                supabaseAdmin.from('student_progress').delete().eq('student_id', id)
            ]);
            console.log('Phase 1 Success: Manual cleanup done.');
        } catch (cleanupErr: any) {
            console.warn('Phase 1 Warning (Manual cleanup failed, might be okay if tables missing):', cleanupErr.message);
        }

        // 2. Delete from Profiles
        console.log('Phase 2: Deleting from profiles table...');
        const { error: profileError, status: profileStatus } = await supabaseAdmin
            .from('profiles')
            .delete()
            .eq('id', id);

        if (profileError) {
            console.error('Phase 2 ERROR (Profiles):', profileError);
            return NextResponse.json({
                error: `Database Error (Profiles): ${profileError.message}`,
                details: profileError.details,
                hint: profileError.hint,
                code: profileError.code,
                status: profileStatus
            }, { status: 400 });
        }
        console.log('Phase 2 Success: Profile deleted.');

        // Small delay to let DB settle before Auth delete
        await new Promise(resolve => setTimeout(resolve, 500));

        // 3. Delete from Auth
        console.log('Phase 3: Deleting from auth.users...');
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);

        if (authError) {
            console.warn('Phase 3 WARNING (Auth):', authError);
            // If user is 404, they are already gone
            if (authError.status === 404 || authError.message.toLowerCase().includes('not found')) {
                console.log('Auth user already gone, proceeding as success.');
            } else {
                // Return a partial success if profile is gone but auth failed
                return NextResponse.json({
                    message: "Profile deleted, but Auth account cleanup failed. You may need to remove them manually from Supabase Dashboard.",
                    error: authError.message,
                    status: authError.status
                }, { status: 207 });
            }
        } else {
            console.log('Phase 3 Success: Auth user deleted.');
        }

        console.log('--- DELETE COMPLETED SUCCESSFULLY ---');
        return NextResponse.json({
            message: `User and all associated data deleted successfully`
        });

    } catch (error: any) {
        console.error('CRITICAL DELETE ERROR:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
