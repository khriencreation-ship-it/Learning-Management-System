
import { supabaseAdmin } from './src/lib/supabase-admin.js';

async function checkProgress() {
    const { data, error } = await supabaseAdmin
        .from('student_progress')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Recent Progress Records:', JSON.stringify(data, null, 2));
}

checkProgress();
