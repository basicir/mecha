import type { TaskConfig, ConfigData } from '@/types';
import fs from 'fs';
import path from 'path';
import { loadAllExampleTasks } from './htmlParser';

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
