
import { supabaseAdmin } from './src/lib/supabase-admin.js';

async function checkTables() {
    // We can't list tables directly via Supabase JS easily without RPC or raw SQL
    // But we can try to query some suspected names
    const tables = ['student_progress', 'course_progress', 'lesson_progress', 'module_progress'];
    
    for (const table of tables) {
        const { error } = await supabaseAdmin.from(table).select('count', { count: 'exact', head: true });
        if (!error) {
            console.log(`Table exists: ${table}`);
        } else {
            console.log(`Table does NOT exist or error: ${table} (${error.message})`);
        }
    }
}

checkTables();
