const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedAdmin() {
  const email = 'admin@khrien.com';
  const password = 'KhrienAdmin2026!'; // You should change this after first login
  const fullName = 'Super Admin';

  console.log(`Attempting to seed admin: ${email}...`);

  // 1. Check if user already exists in Auth
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Error listing users:', listError);
    return;
  }

  const existingUser = users.find(u => u.email === email);
  let userId;

  if (existingUser) {
    console.log('User already exists in Auth. Updating password...');
    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
      existingUser.id,
      { password: password }
    );
    if (updateError) {
      console.error('Error updating password:', updateError);
      return;
    }
    userId = existingUser.id;
    console.log('Password updated successfully.');
  } else {
    console.log('Creating new Auth user...');
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: 'admin'
      }
    });

    if (createError) {
      console.error('Error creating user:', createError);
      return;
    }
    userId = newUser.user.id;
    console.log('Auth user created successfully.');
  }

  // 2. Ensure profile exists in public.profiles
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is "no rows found"
    console.error('Error checking profile:', profileError);
    return;
  }

  if (profile) {
    console.log('Profile already exists. Updating role to admin...');
    const { error: updateProfileError } = await supabase
      .from('profiles')
      .update({ role: 'admin', full_name: fullName, username: email })
      .eq('id', userId);
    
    if (updateProfileError) {
      console.error('Error updating profile:', updateProfileError);
    } else {
      console.log('Profile updated successfully.');
    }
  } else {
    console.log('Creating new profile...');
    const { error: insertProfileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        full_name: fullName,
        username: email,
        role: 'admin',
        status: 'active'
      });
    
    if (insertProfileError) {
      console.error('Error creating profile:', insertProfileError);
    } else {
      console.log('Profile created successfully.');
    }
  }

  console.log('\nSeeding completed!');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log('Please log in and change your password for security.');
}

seedAdmin();
