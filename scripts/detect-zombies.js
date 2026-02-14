
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
    console.log('--- ZOMBIE FILE DETECTION ---');
    const bucket = 'media-library';

    // 1. Get ALL files from DB
    console.log('1. Fetching DB Records...');
    const { data: dbFiles, error: dbError } = await supabase
        .from('media_files')
        .select('key');

    if (dbError) {
        console.error('DB Fetch Error:', dbError);
        return;
    }
    const dbKeys = new Set(dbFiles.map(f => f.key));
    console.log(`   Found ${dbKeys.size} records in DB.`);

    // 2. Get ALL files from Storage
    console.log('2. Fetching Storage Files...');
    const { data: storageFiles, error: storageError } = await supabase
        .storage
        .from(bucket)
        .list('', { limit: 1000, offset: 0 }); // Root level. If you have folders, we need recursion.

    if (storageError) {
        console.error('Storage List Error:', storageError);
        return;
    }

    // LISTING RECURSIVELY (Simple version for flat or 1-level)
    // Note: 'list' returns folders too.
    let allStorageFiles = [];

    async function collectFiles(path) {
        const { data, error } = await supabase.storage.from(bucket).list(path);
        if (error) return;

        for (const item of data) {
            if (item.id === null) {
                // It's a folder (Supabase storage convention usually)
                // console.log(`   Entering folder: ${path ? path + '/' : ''}${item.name}`);
                // await collectFiles(`${path ? path + '/' : ''}${item.name}`);
                // Actually my uploader implementation keeps it FLAT or uses folders.
                // Let's assume flat for now as per my route.ts inspection?
            } else {
                const fullKey = path ? `${path}/${item.name}` : item.name;
                allStorageFiles.push(fullKey);
            }
        }
    }

    await collectFiles('');
    console.log(`   Found ${allStorageFiles.length} files in Storage (Root).`);

    // 3. Compare
    console.log('3. Comparing...');
    const zombies = allStorageFiles.filter(key => !dbKeys.has(key));

    if (zombies.length > 0) {
        console.error(`FOUND ${zombies.length} ZOMBIE FILES (In Storage but NOT in DB):`);
        zombies.forEach(z => console.log(` - ${z}`));
    } else {
        console.log('No zombie files found. Storage and DB are consistent (at root level).');
    }
}

run();
