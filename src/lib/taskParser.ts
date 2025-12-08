import type { TaskConfig, ConfigData } from '@/types';
import fs from 'fs';
import path from 'path';

// Default example tasks that will be loaded dynamically
// This file should be called at build time or on admin page

export function loadExampleTasks(): TaskConfig[] {
    // In production, this would parse the HTML from examples folder
    // For now, return sample structure based on the exam questions

    const exampleTasks: TaskConfig[] = [
        {
            id: 'task-1',
            name: 'Prizmatikus rúd megnyúlása',
            inputVariables: [
                { name: 'delta_l', label: 'Δl', unit: 'mm' },
                { name: 'sigma_x', label: 'σx', unit: 'MPa' },
                { name: 'E', label: 'E', unit: 'GPa' },
                { name: 'F', label: 'F', unit: 'kN' },
            ],
            outputVariables: [
                { name: 'l0', label: 'l₀', unit: 'mm' },
                { name: 'a', label: 'a', unit: 'mm' },
            ],
            equations: [
                { outputVariable: 'a', formula: 'sqrt(F * 1000 / sigma_x)' },
                { outputVariable: 'l0', formula: 'delta_l * E * 1000 / sigma_x' },
            ],
            showingText: 'A rúd terheletlen hossza l₀ = {{l0}} mm. A keresztmetszet élhosszúsága a = {{a}} mm.',
            outputPlaceholders: [
                { variable: 'l0', position: 0 },
                { variable: 'a', position: 1 },
            ],
            images: [],
        },
        {
            id: 'task-2',
            name: 'Síkidom centroid',
            inputVariables: [
                { name: 'a', label: 'a', unit: 'mm' },
                { name: 'b', label: 'b', unit: 'mm' },
                { name: 'd', label: 'd', unit: 'mm' },
                { name: 's', label: 's', unit: 'mm' },
                { name: 'h', label: 'h', unit: 'mm' },
            ],
            outputVariables: [
                { name: 'xC', label: 'xC', unit: 'mm' },
                { name: 'yC', label: 'yC', unit: 'mm' },
            ],
            equations: [
                { outputVariable: 'xC', formula: '(a * d * a/2 + b * h * (d + b/2)) / (a * d + b * h)' },
                { outputVariable: 'yC', formula: '(a * d * d/2 + b * h * h/2) / (a * d + b * h)' },
            ],
            showingText: 'A centroid helyvektora: xC = {{xC}} mm, yC = {{yC}} mm.',
            outputPlaceholders: [
                { variable: 'xC', position: 0 },
                { variable: 'yC', position: 1 },
            ],
            images: ['img_2.png'],
        },
        {
            id: 'task-3',
            name: 'Merev rúd egyensúlya - Kényszererők',
            inputVariables: [
                { name: 'a', label: 'a', unit: 'm' },
                { name: 'b', label: 'b', unit: 'm' },
                { name: 'c', label: 'c', unit: 'm' },
                { name: 'F1', label: '|F₁|', unit: 'kN' },
                { name: 'F2', label: '|F₂|', unit: 'kN' },
                { name: 'F3', label: '|F₃|', unit: 'kN' },
                { name: 'alpha', label: 'α', unit: '°' },
            ],
            outputVariables: [
                { name: 'FAx', label: 'FAx', unit: 'kN' },
                { name: 'FAy', label: 'FAy', unit: 'kN' },
                { name: 'FBx', label: 'FBx', unit: 'kN' },
                { name: 'FBy', label: 'FBy', unit: 'kN' },
            ],
            equations: [
                { outputVariable: 'FAx', formula: 'F1 * cos(alpha * pi / 180) - F3' },
                { outputVariable: 'FAy', formula: 'F1 * sin(alpha * pi / 180) + F2' },
                { outputVariable: 'FBx', formula: '0' },
                { outputVariable: 'FBy', formula: '-F2' },
            ],
            showingText: 'FA = {{FAx}} ex + {{FAy}} ey kN, FB = {{FBx}} ex + {{FBy}} ey kN',
            outputPlaceholders: [
                { variable: 'FAx', position: 0 },
                { variable: 'FAy', position: 1 },
                { variable: 'FBx', position: 2 },
                { variable: 'FBy', position: 3 },
            ],
            images: ['img_3.png'],
        },
    ];

    return exampleTasks;
}

export function saveConfig(config: ConfigData): void {
    const configPath = path.join(process.cwd(), 'config', 'tasks.json');
    const configDir = path.dirname(configPath);

    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

export function loadConfig(): ConfigData | null {
    const configPath = path.join(process.cwd(), 'config', 'tasks.json');

    try {
        if (fs.existsSync(configPath)) {
            const content = fs.readFileSync(configPath, 'utf-8');
            return JSON.parse(content);
        }
    } catch (error) {
        console.error('Error loading config:', error);
    }

    // Return default config if none exists
    return {
        tasks: loadExampleTasks(),
        lastUpdated: new Date().toISOString(),
    };
}
