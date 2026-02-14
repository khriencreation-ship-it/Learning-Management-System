require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixEnrollment() {
    // Find Course
    const { data: courses } = await supabase
        .from('courses')
        .select('id, title')
        .ilike('title', '%Web Development 102%')
        .single();

    if (!courses) {
        console.error('Course not found');
        return;
    }

    console.log(`Course found: ${courses.title} (${courses.id})`);

    // Find the orphan enrollment
    const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('course_id', courses.id);

    if (!enrollments || enrollments.length === 0) {
        console.log('No enrollments found to fix.');
        return;
    }

    for (const enrollment of enrollments) {
        // Check if student is in cohort
        const { data: cohortStudent } = await supabase
            .from('cohort_students')
            .select('id')
            .eq('cohort_id', enrollment.cohort_id)
            .eq('student_id', enrollment.student_id);

        if (!cohortStudent || cohortStudent.length === 0) {
            console.log(`Found orphan enrollment for Student ${enrollment.student_id} in Cohort ${enrollment.cohort_id}`);

            // DELETE IT
            const { error: deleteError } = await supabase
                .from('course_enrollments')
                .delete()
                .eq('course_id', enrollment.course_id)
                .eq('cohort_id', enrollment.cohort_id)
                .eq('student_id', enrollment.student_id);

            if (deleteError) {
                console.error('Error deleting:', deleteError);
            } else {
                console.log('Orphan enrollment deleted successfully.');
            }
        }
    }
}

fixEnrollment();
