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

async function checkEnrollments() {
    console.log('Checking enrollments...');

    const { data, error } = await supabase
        .from('course_enrollments')
        .select('*');

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Total enrollments:', data.length);
        console.log('Sample enrollment:', data[0]);

        const nullCohort = data.filter(e => !e.cohort_id);
        console.log('Enrollments with NULL cohort_id:', nullCohort.length);
    }
}

checkEnrollments();
