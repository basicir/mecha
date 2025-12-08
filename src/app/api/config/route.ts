import { NextResponse } from 'next/server';
import { loadConfig } from '@/lib/taskParser';

export async function GET() {
    try {
        const config = loadConfig();
        return NextResponse.json(config || { tasks: [] });
    } catch (error) {
        console.error('Config load error:', error);
        return NextResponse.json({ error: 'Failed to load config' }, { status: 500 });
    }
}
