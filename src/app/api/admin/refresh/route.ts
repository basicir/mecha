import { NextResponse } from 'next/server';
import { refreshConfigFromExamples } from '@/lib/taskParser';

// POST: Refresh configuration from HTML examples
export async function POST() {
    try {
        const config = refreshConfigFromExamples();

        return NextResponse.json({
            success: true,
            taskCount: config.tasks.length,
            lastUpdated: config.lastUpdated,
        });
    } catch (error) {
        console.error('Refresh config error:', error);
        return NextResponse.json({ error: 'Failed to refresh config' }, { status: 500 });
    }
}
