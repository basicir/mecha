import { parse as parseHTML, HTMLElement } from 'node-html-parser';
import fs from 'fs';
import path from 'path';
import type { TaskConfig, ConfigData, TaskVariable, TaskEquation } from '@/types';

/**
 * Dynamically parses Moodle HTML exam pages to extract question structure.
 * This replaces the hardcoded task definitions.
 */
export function parseExampleHTML(htmlPath: string): TaskConfig[] {
    const html = fs.readFileSync(htmlPath, 'utf-8');
    const root = parseHTML(html);

    const tasks: TaskConfig[] = [];

    // Find all question divs - Moodle uses class "que" for questions
    const questionDivs = root.querySelectorAll('div.que');

    questionDivs.forEach((questionDiv, index) => {
        const taskId = `task-${index + 1}`;

        // Extract question number and title
        const qnoSpan = questionDiv.querySelector('.qno');
        const questionNumber = qnoSpan?.text || String(index + 1);

        // Extract question text from .qtext
        const qtextDiv = questionDiv.querySelector('.qtext');
        const questionText = qtextDiv?.text?.trim() || '';

        // Extract images from the question
        const images: string[] = [];
        const imgElements = questionDiv.querySelectorAll('img');
        imgElements.forEach((img) => {
            const src = img.getAttribute('src');
            // Skip warning/flag icons
            if (src && !src.includes('warning') && !src.includes('flag') && !src.includes('img_0') && !src.includes('img_1.jpg')) {
                images.push(src);
            }
        });

        // Extract input variables - these are the formulas_number inputs
        const inputElements = questionDiv.querySelectorAll('input.formulas_number');
        const inputVariables: TaskVariable[] = [];
        const outputPlaceholders: { variable: string; position: number }[] = [];

        // Parse the input fields to extract variable names
        inputElements.forEach((input, inputIndex) => {
            const name = input.getAttribute('name') || `var_${inputIndex}`;
            const value = input.getAttribute('value') || '';
            const readonly = input.hasAttribute('readonly');

            // Extract the variable name from the label or MathML
            const labelId = input.getAttribute('aria-labelledby');
            let label = `Variable ${inputIndex + 1}`;

            // Try to find label text from preceding MathML
            const parent = input.parentNode;
            if (parent) {
                const mathElements = parent.querySelectorAll('.MathJax');
                if (mathElements.length > 0) {
                    // Get the text from MathML
                    const mathText = mathElements[0].text?.replace(/[=\s]/g, '').trim();
                    if (mathText) {
                        label = mathText;
                    }
                }
            }

            // Find the unit (text after the input)
            let unit = '';
            const textAfterInput = input.nextSibling?.text?.trim();
            if (textAfterInput) {
                // Extract unit like "mm", "kN", etc.
                const unitMatch = textAfterInput.match(/^([a-zA-Z]+(?:\/[a-zA-Z]+)?)/);
                if (unitMatch) {
                    unit = unitMatch[1];
                }
            }

            // Create a simple variable name from the label
            const varName = label.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

            inputVariables.push({
                name: varName,
                label: label,
                unit: unit,
            });

            // For output placeholders, track position
            if (readonly) {
                outputPlaceholders.push({
                    variable: varName,
                    position: inputIndex,
                });
            }
        });

        // Generate a name from the question text
        let taskName = `Kérdés ${questionNumber}`;
        if (questionText.length > 0) {
            // Extract first sentence or first 50 chars
            const firstSentence = questionText.split(/[.!?]/)[0];
            if (firstSentence && firstSentence.length > 10) {
                taskName = firstSentence.substring(0, 60).trim();
                if (firstSentence.length > 60) taskName += '...';
            }
        }

        // Create the task config
        const task: TaskConfig = {
            id: taskId,
            name: taskName,
            inputVariables: inputVariables,
            outputVariables: inputVariables.filter((_, i) =>
                outputPlaceholders.some(p => p.position === i)
            ),
            equations: [], // Will be configured in admin page
            showingText: questionText.substring(0, 500), // First 500 chars
            outputPlaceholders: outputPlaceholders,
            images: [...new Set(images)], // Remove duplicates
        };

        tasks.push(task);
    });

    return tasks;
}

/**
 * Scans the examples folder and parses all HTML files
 */
export function loadAllExampleTasks(): TaskConfig[] {
    const examplesDir = path.join(process.cwd(), 'examples');

    if (!fs.existsSync(examplesDir)) {
        console.warn('Examples directory not found, returning empty tasks');
        return [];
    }

    const allTasks: TaskConfig[] = [];

    // Find all subdirectories with page.html files
    const entries = fs.readdirSync(examplesDir, { withFileTypes: true });

    for (const entry of entries) {
        if (entry.isDirectory()) {
            const htmlPath = path.join(examplesDir, entry.name, 'page.html');
            if (fs.existsSync(htmlPath)) {
                try {
                    const tasks = parseExampleHTML(htmlPath);
                    // Prefix task IDs with folder name for uniqueness
                    tasks.forEach((task, i) => {
                        task.id = `${entry.name}-task-${i + 1}`;
                    });
                    allTasks.push(...tasks);
                } catch (error) {
                    console.error(`Error parsing ${htmlPath}:`, error);
                }
            }
        }
    }

    return allTasks;
}

/**
 * Lists available example files for admin page selection
 */
export function listExampleFiles(): { path: string; name: string }[] {
    const examplesDir = path.join(process.cwd(), 'examples');

    if (!fs.existsSync(examplesDir)) {
        return [];
    }

    const files: { path: string; name: string }[] = [];
    const entries = fs.readdirSync(examplesDir, { withFileTypes: true });

    for (const entry of entries) {
        if (entry.isDirectory()) {
            const htmlPath = path.join(examplesDir, entry.name, 'page.html');
            if (fs.existsSync(htmlPath)) {
                files.push({
                    path: path.join('examples', entry.name, 'page.html'),
                    name: entry.name,
                });
            }
        }
    }

    return files;
}
