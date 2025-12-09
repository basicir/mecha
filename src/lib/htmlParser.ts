import { parse as parseHTML } from 'node-html-parser';
import fs from 'fs';
import path from 'path';
import type { TaskConfig } from '@/types';

/**
 * Parses Moodle HTML exam pages to extract task structure.
 * Only extracts task names and images - NOT input variables (those are manual).
 */
export function parseExampleHTML(htmlPath: string): TaskConfig[] {
    const html = fs.readFileSync(htmlPath, 'utf-8');
    const root = parseHTML(html);

    const tasks: TaskConfig[] = [];

    // Find all question divs - Moodle uses class "que" for questions
    const questionDivs = root.querySelectorAll('div.que');

    questionDivs.forEach((questionDiv, index) => {
        const taskId = `task-${index + 1}`;

        // Extract question number
        const qnoSpan = questionDiv.querySelector('.qno');
        const questionNumber = qnoSpan?.text || String(index + 1);

        // Extract question text from .qtext
        const qtextDiv = questionDiv.querySelector('.qtext');
        const questionText = qtextDiv?.text?.trim() || '';

        // Extract images from the question (skip icons)
        const images: string[] = [];
        const imgElements = questionDiv.querySelectorAll('img');
        imgElements.forEach((img) => {
            const src = img.getAttribute('src');
            if (src && !src.includes('img_0') && !src.includes('img_1.jpg')) {
                images.push(src);
            }
        });

        // Generate task name from question text
        let taskName = `Kérdés ${questionNumber}`;
        if (questionText.length > 10) {
            const firstSentence = questionText.split(/[.!?]/)[0];
            if (firstSentence && firstSentence.length > 10) {
                taskName = firstSentence.substring(0, 60).trim();
                if (firstSentence.length > 60) taskName += '...';
            }
        }

        // Create task - NO auto-detected input variables
        const task: TaskConfig = {
            id: taskId,
            name: taskName,
            inputVariables: [], // Empty - user adds manually
            outputVariables: [],
            equations: [], // Empty - user adds manually
            showingText: questionText, // Full text, no limit
            outputPlaceholders: [],
            images: [...new Set(images)],
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
        console.warn('Examples directory not found');
        return [];
    }

    const allTasks: TaskConfig[] = [];
    const entries = fs.readdirSync(examplesDir, { withFileTypes: true });

    for (const entry of entries) {
        if (entry.isDirectory()) {
            const htmlPath = path.join(examplesDir, entry.name, 'page.html');
            if (fs.existsSync(htmlPath)) {
                try {
                    const tasks = parseExampleHTML(htmlPath);
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
