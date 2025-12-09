import { NextRequest, NextResponse } from 'next/server';
import { saveConfig, saveConfigToSupabase } from '@/lib/taskParser';
import type { ConfigData } from '@/types';

export async function POST(request: NextRequest) {
    try {
        const config: ConfigData = await request.json();

        // Update timestamp
        config.lastUpdated = new Date().toISOString();

        // Save to Supabase (always)
        await saveConfigToSupabase(config);

        // Save to local file only in development (Vercel has read-only filesystem)
        if (process.env.NODE_ENV === 'development') {
            try {
                saveConfig(config);
            } catch (fsError) {
                console.warn('Local file save skipped (production environment):', fsError);
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Saved to Supabase. Changes will sync on next build.'
        });
    } catch (error) {
        console.error('Save config error:', error);
        return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
    }
}
