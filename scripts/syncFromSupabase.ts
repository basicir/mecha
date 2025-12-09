/**
 * Script to sync tasks config from Supabase to local tasks.json
 * Run during build: npx tsx scripts/syncFromSupabase.ts
 */

import { loadConfigFromSupabase, saveConfig } from '../src/lib/taskParser';
import * as path from 'path';
import * as fs from 'fs';

async function main() {
    console.log('🔄 Syncing tasks config from Supabase...');

    try {
        const config = await loadConfigFromSupabase();

        if (!config) {
            console.warn('⚠️  No config found in Supabase');

            // Create empty config if it doesn't exist
            const configPath = path.join(process.cwd(), 'config', 'tasks.json');
            if (!fs.existsSync(configPath)) {
                const emptyConfig = {
                    tasks: [],
                    lastUpdated: new Date().toISOString()
                };
                saveConfig(emptyConfig);
                console.log('📝 Created empty tasks.json');
            } else {
                console.log('📝 Using existing local tasks.json');
            }
            process.exit(0);
        }

        console.log(`✅ Loaded config from Supabase with ${config.tasks.length} tasks`);
        console.log(`   Last updated: ${config.lastUpdated}`);

        // Save to local file
        saveConfig(config);

        const configPath = path.join(process.cwd(), 'config', 'tasks.json');
        console.log(`💾 Saved to: ${configPath}`);

        config.tasks.forEach((task, i) => {
            console.log(`   Task ${i + 1}: ${task.name.substring(0, 50)}...`);
        });

        console.log('\n✨ Sync complete!');
    } catch (error) {
        console.error('❌ Error syncing from Supabase:', error);
        console.warn('⚠️  Continuing with existing tasks.json');
        process.exit(0); // Don't fail the build
    }
}

main();
