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

async function debugWebDev() {
    console.log('--- DEBUGGING WEB DEVELOPMENT 101 ---');

    // 1. Get Course ID
    const { data: courses } = await supabase
        .from('courses')
        .select('id, title')
        .ilike('title', '%Web Development 101%');

    if (!courses || courses.length === 0) {
        console.log('Course not found!');
        return;
    }

    const course = courses[0];
    console.log(`Course Found: ${course.title} (${course.id})`);

    // 2. Get Enrollments for this course
    const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('course_id', course.id);

    console.log(`Total Enrollments: ${enrollments.length}`);
    enrollments.forEach(e => {
        console.log(` - Student: ${e.student_id} | Cohort: ${e.cohort_id}`);
    });

    // 3. Target Cohort
    const targetCohortId = 'baa2f3f5-c22e-4193-898b-e1e6b5c1dd8e';
    console.log(`Target Cohort: ${targetCohortId}`);

    const match = enrollments.find(e => e.cohort_id === targetCohortId);
    if (match) {
        console.log('MATCH FOUND! Count should be > 0');
    } else {
        console.log('NO MATCH FOUND for this cohort.');
    }
}

debugWebDev();
