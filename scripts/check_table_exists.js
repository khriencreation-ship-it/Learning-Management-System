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

async function checkTables() {
    console.log('Checking for cohort_students table...');

    // Try to select from the table
    const { data, error } = await supabase
        .from('cohort_students')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error querying cohort_students:', error.message);
        console.error('Code:', error.code);
        if (error.code === '42P01') { // undefined_table
            console.log('CONFIRMED: Table cohort_students does not exist.');
        }
    } else {
        console.log('SUCCESS: Table cohort_students exists.');
        console.log('Sample data:', data);
    }
}

checkTables();
