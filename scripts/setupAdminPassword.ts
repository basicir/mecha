/**
 * Admin Password Setup Script
 * 
 * This script runs during build and ensures an admin password exists.
 * If no password is set, it generates one and logs it to the build output.
 * 
 * Run with: npx tsx scripts/setupAdminPassword.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function generatePassword(length: number = 12): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    const randomBytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
        password += chars[randomBytes[i] % chars.length];
    }
    return password;
}

async function main() {
    console.log('🔐 Admin Password Setup\n');

    // Skip if env vars not available (local dev without env)
    if (!supabaseUrl || !serviceRoleKey) {
        console.log('⚠️  Supabase env vars not available, skipping password setup.');
        console.log('   This is normal for local development.');
        return;
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check if password already exists
    const { data: existing, error: fetchError } = await supabase
        .from('admin_passwords')
        .select('id')
        .limit(1);

    if (fetchError) {
        // Table might not exist yet - that's ok
        console.log('⚠️  Could not check for existing password:', fetchError.message);
        console.log('   Make sure to run the 002_admin_passwords.sql migration first.');
        return;
    }

    if (existing && existing.length > 0) {
        console.log('✅ Admin password already exists. Skipping generation.');
        return;
    }

    // No password exists - generate one
    const password = generatePassword(12);

    const { error: insertError } = await supabase
        .from('admin_passwords')
        .insert({ password_hash: password });

    if (insertError) {
        console.error('❌ Error inserting password:', insertError.message);
        return;
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('   🆕 NEW ADMIN PASSWORD GENERATED:');
    console.log('');
    console.log(`   ${password}`);
    console.log('');
    console.log('   ⚠️  SAVE THIS PASSWORD! It will not be shown again.');
    console.log('   Check your Vercel build logs if you missed it.');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
}

main().catch((err) => {
    console.error('Admin password setup error:', err);
    // Don't fail the build
});
