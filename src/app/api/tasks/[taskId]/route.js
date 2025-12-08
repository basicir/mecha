import { promises as fs } from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
    try {
        const { taskId } = await params

        // Find folder matching this task ID
        const examplesDir = path.join(process.cwd(), 'examples')
        const items = await fs.readdir(examplesDir)

        // Task ID is folder name with spaces replaced by underscores
        const folder = items.find(item =>
            item.replace(/\s+/g, '_').toLowerCase() === taskId
        )

        if (!folder) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 })
        }

        const htmlPath = path.join(examplesDir, folder, 'page.html')
        const html = await fs.readFile(htmlPath, 'utf-8')

        // Load config for this task
        const configPath = path.join(process.cwd(), 'public', 'config', 'tasks-config.json')
        let config = { inputs: [], outputs: [] }

        try {
            const configData = await fs.readFile(configPath, 'utf-8')
            const allConfigs = JSON.parse(configData)
            if (allConfigs.tasks && allConfigs.tasks[taskId]) {
                config = allConfigs.tasks[taskId]
            }
        } catch (err) {
            // Config might not exist yet
        }

        // Extract title
        const titleMatch = html.match(/<title>([^<]+)<\/title>/)
        const title = titleMatch ? titleMatch[1].split('|')[0].trim() : folder

        return NextResponse.json({
            id: taskId,
            folder: folder,
            title: title,
            html: html,
            config: config
        })
    } catch (error) {
        console.error('Error loading task:', error)
        return NextResponse.json({ error: 'Failed to load task' }, { status: 500 })
    }
}
