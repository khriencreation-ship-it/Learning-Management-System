import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
    try {
        const { users, role } = await request.json();

        if (!users || !Array.isArray(users) || users.length === 0) {
            return NextResponse.json({ error: 'No user data provided' }, { status: 400 });
        }

        if (!['student', 'tutor'].includes(role)) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }

        const stats = {
            total: users.length,
            success: 0,
            failed: 0,
            errors: [] as string[]
        };

        // Fetch current count to generate IDs if needed
        let currentCount = 0;
        const year = new Date().getFullYear();
        const prefix = role === 'student' ? 'STU' : 'TUT';

        // Get the latest ID from the database to ensure we don't conflict
        const { data: latestUsers } = await supabaseAdmin
            .from('profiles')
            .select('identifier')
            .eq('role', role)
            .ilike('identifier', `${prefix}-${year}-%`)
            .order('identifier', { ascending: false })
            .limit(1);

        if (latestUsers && latestUsers.length > 0) {
            const lastId = latestUsers[0].identifier;
            const parts = lastId.split('-');
            if (parts.length === 3) {
                currentCount = parseInt(parts[2], 10);
            }
        }

        for (const [index, user] of users.entries()) {
            try {
                // 1. Data Validation & Normalization
                if (!user.email || !user.name) {
                    throw new Error(`Row ${index + 1}: Name and Email are required`);
                }

                const email = user.email.toLowerCase().trim();
                const name = user.name.trim();

                // 2. ID Generation
                let identifier = user.id || user.studentId || user.tutorId;

                if (!identifier) {
                    currentCount++;
                    const sequence = currentCount.toString().padStart(3, '0');
                    identifier = `${prefix}-${year}-${sequence}`;
                }

                // 3. Password Generation
                // Use provided password or generate random one
                const password = user.password || Math.random().toString(36).slice(-8) + 'Aa1!';

                // 4. Create User in Auth
                const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                    email,
                    password,
                    email_confirm: true,
                    user_metadata: {
                        full_name: name,
                        role: role,
                        identifier: identifier,
                        initial_password: password,
                        force_change_password: true
                    }
                });

                if (authError) {
                    throw new Error(`Row ${index + 1} (${email}): ${authError.message}`);
                }

                // 5. Update Profile
                const { error: profileError } = await supabaseAdmin
                    .from('profiles')
                    .update({
                        phone_number: user.phone || '',
                        payment_status: user.paymentStatus || 'unpaid',
                        username: email
                    })
                    .eq('id', authData.user.id);

                if (profileError) {
                    // Log but don't fail the whole batch, user is created
                    console.error(`Profile update failed for ${email}:`, profileError);
                }

                stats.success++;

            } catch (err: any) {
                stats.failed++;
                stats.errors.push(err.message);
            }
        }

        return NextResponse.json({
            message: `Processed ${stats.total} records.`,
            stats
        });

    } catch (error: any) {
        console.error('Bulk Import Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
