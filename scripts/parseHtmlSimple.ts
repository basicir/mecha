/**
 * Simpler script to parse Create Next App.html using plain text parsing
 * Run with: npx tsx scripts/parseHtmlSimple.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface ParsedTask {
    id: string;
    name: string;
    inputVariables: Array<{ name: string; label: string; unit?: string }>;
    equations: Array<{ outputVariable: string; formula: string }>;
    showingText: string;
}

function extractTaskName(cardHtml: string): string {
    // Find first input with class "input" after Task Name label
    const taskNameMatch = cardHtml.match(/Task Name[\s\S]*?value="([^"]*)"/);
    return taskNameMatch ? taskNameMatch[1] : '';
}

function extractInputVariables(cardHtml: string): Array<{ name: string; label: string }> {
    const variables: Array<{ name: string; label: string }> = [];

    // Find the Input Variables section
    const inputSection = cardHtml.match(/📥 Input Variables[\s\S]*?(?=➗ Equations|📝 Showing Text|$)/);
    if (!inputSection) return variables;

    // Extract all variable names from monospace inputs with placeholder="var_name"
    const varMatches = inputSection[0].matchAll(/placeholder="var_name"[^>]*value="([^"]*)"/g);
    for (const match of varMatches) {
        const name = match[1].trim();
        if (name) {
            variables.push({ name, label: name });
        }
    }

    return variables;
}

function extractEquations(cardHtml: string): Array<{ outputVariable: string; formula: string }> {
    const equations: Array<{ outputVariable: string; formula: string }> = [];

    // Find the Equations section
    const equationsSection = cardHtml.match(/➗ Equations[\s\S]*?(?=📝 Showing Text|$)/);
    if (!equationsSection) return equations;

    // Find all equation blocks
    const equationBlocks = equationsSection[0].matchAll(/placeholder="output"[^>]*value="([^"]*)"[\s\S]*?placeholder="Formula[^>]*value="([^"]*)"/g);

    for (const match of equationBlocks) {
        const outputVar = match[1].trim();
        const formula = match[2].trim();
        if (outputVar && formula) {
            equations.push({ outputVariable: outputVar, formula });
        }
    }

    return equations;
}

function extractShowingText(cardHtml: string): string {
    // Find textarea content after "📝 Showing Text"
    const match = cardHtml.match(/📝 Showing Text[\s\S]*?<textarea[^>]*>([\s\S]*?)<\/textarea>/);
    if (match) {
        return match[1]
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .trim();
    }
    return '';
}

function parseHtmlToTasks(htmlFilePath: string): ParsedTask[] {
    const htmlContent = fs.readFileSync(htmlFilePath, 'utf-8');

    // Split by card divs
    const cardMatches = htmlContent.matchAll(/<div class="card"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*(?=<div class="card"|$)/g);

    const tasks: ParsedTask[] = [];
    let index = 0;

    for (const match of cardMatches) {
        const cardHtml = match[1];

        const task: ParsedTask = {
            id: `task-${index + 1}`,
            name: extractTaskName(cardHtml) || `Task ${index + 1}`,
            inputVariables: extractInputVariables(cardHtml),
            equations: extractEquations(cardHtml),
            showingText: extractShowingText(cardHtml)
        };

        tasks.push(task);
        index++;
    }

    return tasks;
}

function main() {
    const htmlPath = path.join(process.cwd(), 'Create Next App.html');
    const outputPath = path.join(process.cwd(), 'config', 'tasks.json');

    console.log('📖 Parsing HTML file:', htmlPath);

    if (!fs.existsSync(htmlPath)) {
        console.error('❌ HTML file not found:', htmlPath);
        process.exit(1);
    }

    const tasks = parseHtmlToTasks(htmlPath);

    console.log(`✅ Parsed ${tasks.length} tasks`);

    const config = {
        tasks: tasks.map(task => ({
            ...task,
            outputVariables: task.equations.map(eq => ({
                name: eq.outputVariable,
                label: eq.outputVariable,
                unit: ''
            })),
            outputPlaceholders: [],
            images: []
        })),
        lastUpdated: new Date().toISOString()
    };

    // Ensure config directory exists
    const configDir = path.dirname(outputPath);
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }

    // Write to file
    fs.writeFileSync(outputPath, JSON.stringify(config, null, 2));
    console.log('💾 Saved to:', outputPath);

    // Print summary
    tasks.forEach((task, i) => {
        console.log(`\n📋 Task ${i + 1}: ${task.name}`);
        console.log(`   Input vars: ${task.inputVariables.map(v => v.name).join(', ')}`);
        console.log(`   Equations: ${task.equations.length} (${task.equations.map(e => e.outputVariable).join(', ')})`);
        console.log(`   Showing text: ${task.showingText.substring(0, 50)}...`);
    });
}

main();
