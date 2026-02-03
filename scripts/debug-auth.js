const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env vars from .env.local
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        let key = match[1].trim();
        let value = match[2].trim();
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        env[key] = value;
    }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase URL or Service Role Key in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function main() {
    const email = 'barakat2647@gmail.com';
    const password = 'Tot2647tot';

    console.log(`Checking status for user: ${email}...`);

    // List users to find the one we want
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error('Error listing users:', error);
        return;
    }

    const user = users.find(u => u.email === email);

    if (user) {
        console.log(`User found! ID: ${user.id}`);
        console.log(`Email confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);

        // Update password to ensure it matches what the user expects
        console.log('Updating password to ensure match...');
        const updates = { password: password };
        if (!user.email_confirmed_at) {
            updates.email_confirm = true;
        }

        const { error: updateError } = await supabase.auth.admin.updateUserById(
            user.id,
            updates
        );

        if (updateError) {
            console.error('Failed to update password:', updateError);
        } else {
            console.log('Password updated successfully!');
            console.log('User should be able to login now.');
        }
    } else {
        console.log('User not found. Creating user...');
        const { data, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        });

        if (createError) {
            console.error('Error creating user:', createError);
        } else {
            console.log('User created successfully:', data.user.id);
            console.log('User should be able to login now.');
        }
    }
}

main().catch(console.error);
