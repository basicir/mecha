import { NextRequest, NextResponse } from 'next/server';
import { saveConfig, saveConfigToSupabase } from '@/lib/taskParser';
import type { ConfigData } from '@/types';

export async function POST(request: NextRequest) {
    try {
        const config: ConfigData = await request.json();

        // Update timestamp
        config.lastUpdated = new Date().toISOString();

        // Save to file (local)
        saveConfig(config);

        // Save to Supabase
        await saveConfigToSupabase(config);

        return NextResponse.json({ success: true, message: 'Saved to file and Supabase' });
    } catch (error) {
        console.error('Save config error:', error);
        return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
    }
}
