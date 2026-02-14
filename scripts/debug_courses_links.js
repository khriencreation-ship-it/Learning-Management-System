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

async function debugCourses() {
    console.log('--- ALL COURSES ---');
    const { data: courses } = await supabase.from('courses').select('id, title');
    courses.forEach(c => console.log(`${c.id} : ${c.title}`));

    console.log('\n--- COURSE COHORTS ---');
    const { data: links } = await supabase.from('course_cohorts').select('*');
    links.forEach(l => console.log(`Cohort: ${l.cohort_id} -> Course: ${l.course_id}`));
}

debugCourses();
