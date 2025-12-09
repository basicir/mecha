/**
 * Script to sync tasks config from Supabase to local tasks.json
 * Run during build: npx tsx scripts/syncFromSupabase.ts
 */

import { loadConfigFromSupabase, saveConfig } from '../src/lib/taskParser';
import { loadAllExampleTasks } from '../src/lib/htmlParser';
import * as path from 'path';

async function main() {
    console.log('🔄 Syncing tasks config from Supabase...');

    try {
        const config = await loadConfigFromSupabase();

        if (!config || config.tasks.length === 0) {
            console.warn('⚠️  No config found in Supabase or config is empty');
            console.log('📖 Loading tasks from public/examples/page.html instead...');

            // Load tasks from HTML examples
            const tasksFromHTML = loadAllExampleTasks();

            if (tasksFromHTML.length > 0) {
                const newConfig = {
                    tasks: tasksFromHTML,
                    lastUpdated: new Date().toISOString()
                };

                saveConfig(newConfig);
                console.log(`✅ Loaded ${tasksFromHTML.length} tasks from HTML examples`);
                console.log('💾 Saved to local tasks.json');

                tasksFromHTML.forEach((task, i) => {
                    console.log(`   Task ${i + 1}: ${task.name}`);
                });
            } else {
                console.warn('⚠️  No tasks found in HTML examples either');
                // Create minimal empty config
                const emptyConfig = {
                    tasks: [],
                    lastUpdated: new Date().toISOString()
                };
                saveConfig(emptyConfig);
                console.log('📝 Created empty tasks.json');
            }

            console.log('\n✨ Sync complete!');
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
