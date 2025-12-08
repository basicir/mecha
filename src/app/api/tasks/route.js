import { promises as fs } from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const examplesDir = path.join(process.cwd(), 'examples')

        // Read all folders from examples
        const items = await fs.readdir(examplesDir)
        const taskFolders = []

        for (const item of items) {
            const fullPath = path.join(examplesDir, item)
            const stat = await fs.stat(fullPath)

            if (stat.isDirectory() && item.startsWith('page_files')) {
                taskFolders.push(item)
            }
        }

        // Build tasks array
        const tasks = []

        for (const folder of taskFolders) {
            const htmlPath = path.join(examplesDir, folder, 'page.html')

            try {
                const html = await fs.readFile(htmlPath, 'utf-8')

                // Extract title from HTML
                const titleMatch = html.match(/<title>([^<]+)<\/title>/)
                const title = titleMatch ? titleMatch[1].split('|')[0].trim() : folder

                tasks.push({
                    id: folder.replace(/\s+/g, '_').toLowerCase(),
                    folder: folder,
                    title: title
                })
            } catch (err) {
                console.error(`Error reading ${htmlPath}:`, err)
            }
        }

        return NextResponse.json({ tasks })
    } catch (error) {
        console.error('Error loading tasks:', error)
        return NextResponse.json({ error: 'Failed to load tasks' }, { status: 500 })
    }
}
