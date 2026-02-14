const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Required environment variables missing.');
    console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
    process.exit(1);
}

// Create Supabase client with Service Role Key (Admin rights)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const usersToSeed = [
    {
        email: 'admin@khrien.com',
        password: 'password123',
        user_metadata: {
            full_name: 'Super Admin',
            role: 'admin',
            identifier: 'ADMIN-001'
        }
    },
    {
        email: 'student@khrien.com',
        password: 'password123',
        user_metadata: {
            full_name: 'John Student',
            role: 'student',
            identifier: 'STU-2025-001'
        }
    },
    {
        email: 'tutor@khrien.com',
        password: 'password123',
        user_metadata: {
            full_name: 'Jane Tutor',
            role: 'tutor',
            identifier: 'TUT-2025-001'
        }
    }
];

async function seedUsers() {
    console.log('🌱 Starting user seeding...');

    for (const user of usersToSeed) {
        try {
            console.log(`Creating user: ${user.email} (${user.user_metadata.role})...`);

            // 1. Create User in Auth
            const { data, error } = await supabase.auth.admin.createUser({
                email: user.email,
                password: user.password,
                email_confirm: true, // Auto-confirm email
                user_metadata: user.user_metadata
            });

            if (error) {
                console.error(`❌ Failed to create ${user.email}:`, error.message);
                continue;
            }

            console.log(`✅ Created ${user.email} (ID: ${data.user.id})`);

            // Note: The SQL Trigger 'on_auth_user_created' should automatically create the profile.
            // verifying...

            // Wait a small bit for trigger
            await new Promise(r => setTimeout(r, 500));

            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .single();

            if (profile) {
                console.log(`   -> Profile verified: ${profile.identifier}`);
            } else {
                console.warn(`   ⚠️ Profile missing (Trigger might have failed or not run yet).`);
            }

        } catch (err) {
            console.error(`Unexpected error for ${user.email}:`, err);
        }
    }

    console.log('✨ Seeding complete!');
}

seedUsers();
