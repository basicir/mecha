/**
 * Script to parse Create Next App.html and extract tasks data
 * Run with: npx tsx scripts/parseHtmlToTasks.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { JSDOM } from 'jsdom';

interface ParsedTask {
    id: string;
    name: string;
    inputVariables: Array<{ name: string; label: string; unit?: string }>;
    equations: Array<{ outputVariable: string; formula: string }>;
    showingText: string;
}

function parseHtmlToTasks(htmlFilePath: string): ParsedTask[] {
    const htmlContent = fs.readFileSync(htmlFilePath, 'utf-8');
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;

    const tasks: ParsedTask[] = [];
    const taskCards = document.querySelectorAll('.card');

    taskCards.forEach((card, index) => {
        // Extract task name
        const taskNameInput = card.querySelector('input.input[type="text"]');
        const taskName = taskNameInput?.getAttribute('value') || `Task ${index + 1}`;

        // Extract input variables
        const inputVariables: Array<{ name: string; label: string; unit?: string }> = [];
        const inputVarInputs = card.querySelectorAll('div:has(> h3:contains("📥 Input Variables")) + div input.input[style*="monospace"]');

        // Better selector: find the section with Input Variables
        const inputSection = Array.from(card.querySelectorAll('h3')).find(h3 =>
            h3.textContent?.includes('📥 Input Variables')
        );

        if (inputSection) {
            const inputContainer = inputSection.parentElement?.nextElementSibling;
            if (inputContainer) {
                const varInputs = inputContainer.querySelectorAll('input.input[style*="monospace"]');
                varInputs.forEach(input => {
                    const name = (input as HTMLInputElement).value.trim();
                    if (name) {
                        inputVariables.push({ name, label: name });
                    }
                });
            }
        }

        // Extract equations
        const equations: Array<{ outputVariable: string; formula: string }> = [];
        const equationSection = Array.from(card.querySelectorAll('h3')).find(h3 =>
            h3.textContent?.includes('➗ Equations')
        );

        if (equationSection) {
            const equationsContainer = equationSection.parentElement?.parentElement;
            if (equationsContainer) {
                const equationBlocks = equationsContainer.querySelectorAll('div[style*="rgba(0, 0, 0, 0.2)"]');
                equationBlocks.forEach(block => {
                    const outputInput = block.querySelector('input.input[style*="monospace"][placeholder="output"]') as HTMLInputElement;
                    const formulaInput = block.querySelector('input.input[placeholder*="Formula"]') as HTMLInputElement;

                    if (outputInput && formulaInput) {
                        const outputVar = outputInput.value.trim();
                        const formula = formulaInput.value.trim();
                        if (outputVar && formula) {
                            equations.push({ outputVariable: outputVar, formula });
                        }
                    }
                });
            }
        }

        // Extract showing text
        let showingText = '';
        const showingTextLabel = Array.from(card.querySelectorAll('label')).find(label =>
            label.textContent?.includes('📝 Showing Text')
        );

        if (showingTextLabel) {
            const textarea = showingTextLabel.nextElementSibling?.querySelector('textarea');
            if (textarea) {
                showingText = (textarea as HTMLTextAreaElement).value || (textarea as HTMLTextAreaElement).textContent || '';
            }
        }

        tasks.push({
            id: `task-${index + 1}`,
            name: taskName,
            inputVariables,
            equations,
            showingText: showingText.trim()
        });
    });

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
        console.log(`   Input vars: ${task.inputVariables.length}`);
        console.log(`   Equations: ${task.equations.length}`);
    });
}

main();
