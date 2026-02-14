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

async function checkCount() {
    const cohortId = 'baa2f3f5-c22e-4193-898b-e1e6b5c1dd8e';
    const courseId = '7684fb8c-965c-4add-a398-c82e89d1ee2e';

    console.log(`Checking enrollments for:\nCohort: ${cohortId}\nCourse: ${courseId}`);

    const { data, error, count } = await supabase
        .from('course_enrollments')
        .select('*', { count: 'exact' })
        .eq('cohort_id', cohortId)
        .eq('course_id', courseId);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Count:', count);
        console.log('Records:', data);
    }
}

checkCount();
