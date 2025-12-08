import { NextRequest, NextResponse } from 'next/server';
import { saveConfig } from '@/lib/taskParser';
import type { ConfigData } from '@/types';

export async function POST(request: NextRequest) {
    try {
        const config: ConfigData = await request.json();

        // Update timestamp
        config.lastUpdated = new Date().toISOString();

        // Save to file
        saveConfig(config);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Save config error:', error);
        return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
    }
}
