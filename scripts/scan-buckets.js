
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
    console.log('--- GLOBAL BUCKET SCAN ---');

    // Potential buckets to check
    const buckets = ['media-library', 'courses', 'cohorts', 'avatars', 'images', 'videos'];

    for (const bucket of buckets) {
        console.log(`\nChecking Bucket: [${bucket}]`);
        const { data, error } = await supabase.storage.from(bucket).list('', { limit: 100, offset: 0 });

        if (error) {
            console.log(`  -> Error/Not Found: ${error.message}`);
            continue;
        }

        if (data.length === 0) {
            console.log('  -> Empty');
        } else {
            console.log(`  -> Found ${data.length} items:`);
            data.forEach(item => {
                console.log(`     - ${item.name} (${item.id ? 'File' : 'Folder'})`);
            });
        }
    }
}

run();
