/**
 * Build-time script to load all tasks from examples folder
 * This generates the tasks configuration from HTML files
 * Run: node scripts/generate-tasks.js
 */

const fs = require('fs')
const path = require('path')

const EXAMPLES_DIR = path.join(process.cwd(), 'examples')
const CONFIG_DIR = path.join(process.cwd(), 'public', 'config')
const TASKS_FILE = path.join(CONFIG_DIR, 'tasks.json')

function getTaskFolders() {
    const items = fs.readdirSync(EXAMPLES_DIR)
    return items.filter(item => {
        const fullPath = path.join(EXAMPLES_DIR, item)
        return fs.statSync(fullPath).isDirectory() && item.startsWith('page_files')
    })
}

function extractTitle(html) {
    const match = html.match(/<title>([^<]+)<\/title>/)
    return match ? match[1].split('|')[0].trim() : 'Unknown Task'
}

function generateTaskId(folderName) {
    return folderName.replace(/\s+/g, '_').toLowerCase()
}

function generateTasks() {
    const folders = getTaskFolders()

    const tasks = folders.map(folder => {
        const htmlPath = path.join(EXAMPLES_DIR, folder, 'page.html')

        if (!fs.existsSync(htmlPath)) {
            console.warn(`No page.html found in ${folder}`)
            return null
        }

        const html = fs.readFileSync(htmlPath, 'utf-8')
        const title = extractTitle(html)
        const taskId = generateTaskId(folder)

        return {
            id: taskId,
            folder: folder,
            title: title,
            htmlFile: 'page.html',
            config: null // Will be set from tasks-config.json
        }
    }).filter(Boolean)

    // Ensure config directory exists
    if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true })
    }

    // Write tasks list
    const output = {
        generatedAt: new Date().toISOString(),
        tasks: tasks
    }

    fs.writeFileSync(TASKS_FILE, JSON.stringify(output, null, 2))
    console.log(`Generated ${tasks.length} tasks to ${TASKS_FILE}`)

    return tasks
}

// Run if called directly
if (require.main === module) {
    generateTasks()
}

module.exports = { generateTasks, getTaskFolders }
