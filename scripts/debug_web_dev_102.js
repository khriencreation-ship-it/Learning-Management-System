require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findIds() {
    // Find Course
    const { data: courses, error: courseError } = await supabase
        .from('courses')
        .select('id, title, code')
        .ilike('title', '%Web Development 102%');

    if (courseError) {
        console.error('Error fetching courses:', courseError);
        return;
    }

    console.log('Courses found:', courses);

    if (courses.length === 0) return;

    const courseId = courses[0].id;

    // Find Enrollments for this course to see which cohorts are involved
    const { data: enrollments, error: enrollError } = await supabase
        .from('course_enrollments')
        .select('student_id, cohort_id, enrolled_at')
        .eq('course_id', courseId);

    if (enrollError) {
        console.error('Error fetching enrollments:', enrollError);
        return;
    }

    console.log(`Enrollments for ${courses[0].title} (${courseId}):`);
    console.log(enrollments);
    console.log(`Total count: ${enrollments.length}`);

    if (enrollments.length > 0) {
        const enrollment = enrollments[0];
        console.log(`Checking if student ${enrollment.student_id} is in cohort ${enrollment.cohort_id}...`);

        const { data: cohortStudent, error: csError } = await supabase
            .from('cohort_students')
            .select('*')
            .eq('cohort_id', enrollment.cohort_id)
            .eq('student_id', enrollment.student_id);

        if (csError) {
            console.error('Error checking cohort_students:', csError);
        } else {
            console.log('Is student in cohort_students?', cohortStudent && cohortStudent.length > 0 ? 'YES' : 'NO');
        }

        // Check student profile
        const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', enrollment.student_id).single();
        console.log('Student Name:', profile?.full_name);
    }
}

findIds();
