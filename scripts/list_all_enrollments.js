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

async function listAllEnrollments() {
    console.log('Listing ALL enrollments...');

    const { data, error } = await supabase
        .from('course_enrollments')
        .select('*');

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Total:', data.length);
        data.forEach(e => {
            console.log(`Course: ${e.course_id}, Student: ${e.student_id}, Cohort: ${e.cohort_id}`);
        });
    }
}

listAllEnrollments();
