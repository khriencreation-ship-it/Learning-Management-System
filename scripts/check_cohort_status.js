const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCohort() {
    const { data, error } = await supabase
        .from('cohorts')
        .select('id, name, status, start_date, end_date')
        .eq('name', 'Cohort 2')
        .single();

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Cohort data from database:');
        console.log(JSON.stringify(data, null, 2));
    }
}

checkCohort().then(() => process.exit(0));
