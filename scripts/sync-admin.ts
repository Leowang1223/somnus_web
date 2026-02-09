
import { createClient } from '@supabase/supabase-js';
import pkg from '@supabase/supabase-js';

// Setup environment check
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables. Please check .env or .env.local');
    console.log('Required:');
    console.log(' - NEXT_PUBLIC_SUPABASE_URL');
    console.log(' - SUPABASE_SERVICE_ROLE_KEY (must be the service role key, not anon)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function syncUsers() {
    console.log('🔄 Syncing users from Auth to public.users...');

    // 1. Get all users from Auth
    // Note: listUsers defaults to page 1, limit 50. Increase limit if needed.
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();

    if (authError || !users) {
        console.error('❌ Failed to fetch auth users:', authError);
        return;
    }

    console.log(`📊 Found ${users.length} users in Auth.`);

    for (const user of users) {
        const email = user.email!;
        console.log(`   Processing ${email}...`);

        // Determine Role
        // You can customize this logic. For now, hardcode your admin email.
        let role = 'consumer';

        // START CUSTOM CONFIG
        // Replace with your actual admin email(s)
        const ADMIN_EMAILS = ['owner@somnus.com', 'admin@somnus.com', 'shiro@somnus.com'];
        // END CUSTOM CONFIG

        // Check if email contains 'admin' or matches list
        if (ADMIN_EMAILS.includes(email) || email.includes('admin')) {
            role = 'owner';
        } else if (email.includes('support')) {
            role = 'support';
        }

        // Upsert into public.users
        const { error: upsertError } = await supabase
            .from('users')
            .upsert({
                id: user.id,
                email: email,
                // If name exists in metadata, use it, else split email
                name: user.user_metadata?.name || email.split('@')[0],
                role: role,
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' });

        if (upsertError) {
            console.error(`   ❌ Failed to sync ${email}:`, upsertError.message);
        } else {
            console.log(`   ✅ Synced ${email} as [${role}]`);
        }
    }

    console.log('\n✨ Sync completed.');
}

syncUsers().catch(console.error);
