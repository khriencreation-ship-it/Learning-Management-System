const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAdmin() {
  const { data, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error('Error listing users:', error);
    return;
  }

  const admin = data.users.find(u => u.email === 'admin@khrien.com');
  
  if (admin) {
    console.log('Admin user found:');
    console.log('ID:', admin.id);
    console.log('Metadata:', JSON.stringify(admin.user_metadata, null, 2));
  } else {
    console.log('Admin user @khrien.com not found.');
    console.log('Available users:', data.users.map(u => u.email).join(', '));
  }
}

checkAdmin();
