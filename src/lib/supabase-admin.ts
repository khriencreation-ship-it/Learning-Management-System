import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    // We don't throw immediately to allow build time to pass if envs are missing, 
    // but runtime operations will fail or we can throw inside functions. 
    // For now, let's just log a warning if accessed.
    console.warn('Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL');
}

// Create a client with the Service Role Key
// This client BYPASSES Row Level Security (RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || '', {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
