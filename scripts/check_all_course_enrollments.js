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

async function checkAllEnrollmentsForCourse() {
    const courseId = '7684fb8c-965c-4add-a398-c82e89d1ee2e';

    console.log(`Checking ALL enrollments for Course: ${courseId}`);

    const { data, error } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('course_id', courseId);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Total enrollments for course:', data.length);
        console.log('Records:', data);
    }
}

checkAllEnrollmentsForCourse();
