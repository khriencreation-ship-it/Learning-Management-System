const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load env
const envLocal = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf8');
const envConfig = dotenv.parse(envLocal);

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugJoin() {
    console.log('Debugging Join Query...');

    // 1. Get a valid cohort_id
    const { data: request } = await supabase.from('cohort_students').select('cohort_id').limit(1);
    const cohortId = request?.[0]?.cohort_id;

    if (!cohortId) {
        console.log('No cohort_students found to test with.');
        return;
    }

    console.log(`Testing with Cohort ID: ${cohortId}`);

    // 2. Try the exact query from the API
    console.log('\n--- Attempt 1: profiles:student_id ---');
    const { data: d1, error: e1 } = await supabase
        .from('cohort_students')
        .select(`
            student_id,
            profiles:student_id (
                id,
                full_name
            )
        `)
        .eq('cohort_id', cohortId);

    if (e1) console.error('Error 1:', e1.message);
    else console.log('Success 1:', d1.length, 'records');

    // 3. Try implicit
    console.log('\n--- Attempt 2: profiles (implicit) ---');
    const { data: d2, error: e2 } = await supabase
        .from('cohort_students')
        .select(`
            student_id,
            profiles (
                id,
                full_name
            )
        `)
        .eq('cohort_id', cohortId);

    if (e2) console.error('Error 2:', e2.message);
    else console.log('Success 2:', d2.length, 'records');

    // 4. Try inner join style? No, PostgREST is resourceful.
}

debugJoin();
