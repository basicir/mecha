import type { TaskConfig, ConfigData } from '@/types';
import fs from 'fs';
import path from 'path';
import { loadAllExampleTasks } from './htmlParser';
import { getServiceSupabase } from './supabase';

const CONFIG_PATH = path.join(process.cwd(), 'config', 'tasks.json');

/**
 * Saves configuration to JSON file
 */
export function saveConfig(config: ConfigData): void {
    const configDir = path.dirname(CONFIG_PATH);

    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }

    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

/**
 * Saves configuration to Supabase
 */
export async function saveConfigToSupabase(config: ConfigData): Promise<void> {
    try {
        const supabase = getServiceSupabase();

        // Get the latest config entry (there should only be one)
        const { data: existingConfigs, error: fetchError } = await supabase
            .from('tasks_config')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(1);

        if (fetchError) throw fetchError;

        const version = existingConfigs && existingConfigs.length > 0
            ? (existingConfigs[0].version || 0) + 1
            : 1;

        if (existingConfigs && existingConfigs.length > 0) {
            // Update existing config
            const { error: updateError } = await supabase
                .from('tasks_config')
                .update({
                    config_data: config as any,
                    version: version
                })
                .eq('id', existingConfigs[0].id);

            if (updateError) throw updateError;
        } else {
            // Insert new config
            const { error: insertError } = await supabase
                .from('tasks_config')
                .insert({
                    config_data: config as any,
                    version: version
                });

            if (insertError) throw insertError;
        }

        console.log('✅ Config saved to Supabase, version:', version);
    } catch (error) {
        console.error('❌ Error saving config to Supabase:', error);
        throw error;
    }
}

/**
 * Loads configuration from Supabase
 */
export async function loadConfigFromSupabase(): Promise<ConfigData | null> {
    try {
        const supabase = getServiceSupabase();

        const { data, error } = await supabase
            .from('tasks_config')
            .select('config_data')
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            console.error('Error loading config from Supabase:', error);
            return null;
        }

        if (data && data.config_data) {
            return data.config_data as ConfigData;
        }

        return null;
    } catch (error) {
        console.error('Error loading config from Supabase:', error);
        return null;
    }
}

/**
 * Loads configuration from JSON file, or parses from HTML if not exists
 */
export function loadConfig(): ConfigData | null {
    try {
        // First try to load saved config
        if (fs.existsSync(CONFIG_PATH)) {
            const content = fs.readFileSync(CONFIG_PATH, 'utf-8');
            return JSON.parse(content);
        }
    } catch (error) {
        console.error('Error loading saved config:', error);
    }

    // If no saved config, parse from HTML examples
    try {
        const tasks = loadAllExampleTasks();

        return {
            tasks,
            lastUpdated: new Date().toISOString(),
        };
    } catch (error) {
        console.error('Error parsing example tasks:', error);
        return {
            tasks: [],
            lastUpdated: new Date().toISOString(),
        };
    }
}

/**
 * Refreshes config from HTML examples (used when new examples are added)
 */
export function refreshConfigFromExamples(): ConfigData {
    const tasks = loadAllExampleTasks();

    const config: ConfigData = {
        tasks,
        lastUpdated: new Date().toISOString(),
    };

    // Save the refreshed config
    saveConfig(config);

    return config;
}

