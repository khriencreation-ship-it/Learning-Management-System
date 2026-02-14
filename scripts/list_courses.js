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

async function listCourses() {
    console.log('Listing ALL courses...');

    const { data, error } = await supabase
        .from('courses')
        .select('id, title');

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Total:', data.length);
        data.forEach(c => {
            console.log(`ID: ${c.id}, Title: ${c.title}`);
        });
    }
}

listCourses();
