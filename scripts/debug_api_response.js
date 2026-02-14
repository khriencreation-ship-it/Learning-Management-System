const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const http = require('http');

// Load env
const envLocal = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf8');
const envConfig = dotenv.parse(envLocal);

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const COHORT_ID = 'baa2f3f5-c22e-4193-898b-e1e6b5c1dd8e';

async function fetchApi() {
    return new Promise((resolve, reject) => {
        http.get(`http://localhost:3000/api/admin/cohorts/${COHORT_ID}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
}

async function debug() {
    console.log('--- DEBUG API VS DB ---');

    // 1. Fetch from API
    try {
        const apiData = await fetchApi();
        console.log('API Response (Courses):');
        if (apiData.courses) {
            apiData.courses.forEach(c => {
                console.log(` - ${c.title} (${c.id}): Count=${c.student_count}`);
            });
            return apiData.courses.map(c => c.id);
        } else {
            console.log('No courses in API response:', apiData);
            return [];
        }
    } catch (e) {
        console.error('API Fetch Error:', e.message);
        return [];
    }
}

async function run() {
    const courseIds = await debug();

    if (courseIds.length === 0) return;

    // 2. Run DB Query manually
    console.log('\n--- MANUAL DB QUERY ---');
    console.log('Cohort:', COHORT_ID);
    console.log('Course IDs:', courseIds);

    const { data: enrollments, error } = await supabase
        .from('course_enrollments')
        .select('course_id, student_id, cohort_id')
        .eq('cohort_id', COHORT_ID)
        .in('course_id', courseIds);

    if (error) {
        console.error('DB Error:', error);
    } else {
        console.log(`Found ${enrollments.length} enrollments in DB.`);
        enrollments.forEach(e => {
            console.log(` - Enrollment: Course=${e.course_id}, Student=${e.student_id}`);
        });
    }
}

run();
