import { promises as fs } from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
    try {
        const { taskId, imageName } = await params

        // Find folder matching this task ID
        const examplesDir = path.join(process.cwd(), 'examples')
        const items = await fs.readdir(examplesDir)

        const folder = items.find(item =>
            item.replace(/\s+/g, '_').toLowerCase() === taskId
        )

        if (!folder) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 })
        }

        const imagePath = path.join(examplesDir, folder, imageName)

        try {
            const imageBuffer = await fs.readFile(imagePath)

            // Determine content type
            const ext = path.extname(imageName).toLowerCase()
            const contentType = ext === '.png' ? 'image/png' :
                ext === '.gif' ? 'image/gif' :
                    'image/jpeg'

            return new NextResponse(imageBuffer, {
                headers: {
                    'Content-Type': contentType,
                    'Cache-Control': 'public, max-age=31536000'
                }
            })
        } catch (err) {
            return NextResponse.json({ error: 'Image not found' }, { status: 404 })
        }
    } catch (error) {
        console.error('Error serving image:', error)
        return NextResponse.json({ error: 'Failed to serve image' }, { status: 500 })
    }
}
