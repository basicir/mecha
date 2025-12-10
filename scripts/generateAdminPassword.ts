/**
 * Admin Password Generator Script
 * 
 * This script generates a random password and stores it in the admin_passwords table.
 * Run with: npx tsx scripts/generateAdminPassword.ts
 * 
 * IMPORTANT: Save the generated password! It will only be shown once.
 * 
 * Make sure to have these environment variables set:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing environment variables!');
    console.error('   Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

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
    console.log('🔐 Admin Password Generator\n');

    // Generate password
    const password = generatePassword(12);

    // Clear existing passwords and insert new one
    // (Simple approach - only one admin password at a time)
    const { error: deleteError } = await supabase
        .from('admin_passwords')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteError) {
        console.error('❌ Error clearing old passwords:', deleteError.message);
        process.exit(1);
    }

    // Insert new password (stored as plain text for simplicity)
    const { error: insertError } = await supabase
        .from('admin_passwords')
        .insert({ password_hash: password });

    if (insertError) {
        console.error('❌ Error inserting password:', insertError.message);
        process.exit(1);
    }

    console.log('✅ Password generated and saved successfully!\n');
    console.log('═══════════════════════════════════════');
    console.log('   YOUR ADMIN PASSWORD:');
    console.log(`   ${password}`);
    console.log('═══════════════════════════════════════\n');
    console.log('⚠️  SAVE THIS PASSWORD! It will not be shown again.\n');
}

main().catch(console.error);
