/**
 * ONE-TIME script to upload existing tasks.json to Supabase
 * Run once: npx tsx scripts/uploadInitialConfig.ts
 * After this, use the admin page to manage configs
 */

import { loadConfig, saveConfigToSupabase } from '../src/lib/taskParser';

async function main() {
    console.log('📤 Uploading initial config from tasks.json to Supabase...');

    try {
        const config = loadConfig();

        if (!config || config.tasks.length === 0) {
            console.error('❌ No config found in tasks.json');
            process.exit(1);
        }

        console.log(`✅ Loaded config with ${config.tasks.length} tasks from local file`);

        await saveConfigToSupabase(config);

        console.log('\n✨ Upload complete!');
        console.log('From now on, use the /admin page to manage configurations.');
        console.log('Changes will be saved to Supabase and synced during builds.');
    } catch (error) {
        console.error('❌ Error uploading config:', error);
        process.exit(1);
    }
}

main();
